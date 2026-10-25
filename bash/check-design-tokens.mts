#!/usr/bin/env node
/**
 * 设计令牌接线门禁 — 防止 S7 类缺陷（"令牌文件存在，但产物里没有"）再次发生。
 *
 * 背景：`@ydsz-core/design-tokens` 的 variables.css 定义了 116 个 `--ydsz-*` token，
 * 全仓 112 个名字在被组件消费，但它**从未进入任何构建产物**——所有取值都靠调用点
 * `var(--x, 兜底值)` 兜着，主题/暗色切换对这些组件完全无效。根因有两层，单独看任何
 * 一层都像"没问题"：
 *   1. 没有任何入口 import 它（只有 ydsz-ui 的 playground 引了）；
 *   2. 加上 import 后，库构建的 `external` 回调把 `依赖包名/**` 全部外置，
 *      CSS 子路径也被外置 → 只在 dist/index.mjs 留一条 import 语句，
 *      而应用按 exports 取的是 dist/design.css → 依旧没有。
 * 因此本门禁同时断言"被入口 import"和"产物里真的有"，而不是只查文件在不在。
 *
 * 校验项：
 *   A. 两个令牌 CSS 文件存在，且被 base/design 的令牌入口 import，且该包在 deps 中声明
 *   B. 源码里每个 `var(--ydsz-X)` 都有定义（按消费域分别取定义集合）
 *   C. token 模块用模板拼出的变量名（`var(--ydsz-text-${level})`）逐个展开后都有定义；
 *      取值集合来自参数类型声明，枚举不出来则硬失败（不接受"跳过"）
 *   D. 暗色覆盖块必须同时命中 `.dark` 类（两条主题链路唯一共同的信号）
 *   E. 若 base/design 已构建，产物 design.css 必须真的含令牌定义
 *   F. compat-aliases.css 里未被任何消费方引用的别名 → 警告（提示可删）
 *
 * 用法：
 *   node ./bash/check-design-tokens.mts              # 校验
 *   node ./bash/check-design-tokens.mts --self-test   # 用反例证明本门禁不是空转
 *
 * @path bash/check-design-tokens.mts
 * @author ydsz-team
 * @since 4.5.0
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const VARIABLES_CSS = join(ROOT_DIR, 'comm/@core/ui-kit/design-tokens/src/styles/variables.css');
const COMPAT_CSS = join(ROOT_DIR, 'comm/@core/ui-kit/design-tokens/src/styles/compat-aliases.css');
const GLOBAL_CSS = join(ROOT_DIR, 'comm/@core/base/design/src/css/global.css');
const TOKEN_ENTRY = join(ROOT_DIR, 'comm/@core/base/design/src/design-tokens/index.ts');
const DESIGN_PKG = join(ROOT_DIR, 'comm/@core/base/design/package.json');
const DESIGN_DIST = join(ROOT_DIR, 'comm/@core/base/design/dist/design.css');
const DOCS_CUSTOM_CSS = join(ROOT_DIR, 'apps/docs-site/.vitepress/theme/custom.css');
const TOKEN_SRC = join(ROOT_DIR, 'comm/@core/ui-kit/design-tokens/src');

/**
 * 从 token 模块的模板字符串反推"JS 侧能拼出的 CSS 变量名"。
 *
 * 不维护人工表格：形如
 *   export function textTokenVar(level: 'primary' | 'secondary'): string {
 *     return `var(--ydsz-text-${level})`;
 *   }
 * 的函数，取值集合直接来自参数类型声明（字面量联合 / `keyof typeof 对象` / 具别名字面量联合），
 * 常量前缀 `var(${VAR_PREFIX}-duration-${token})` 里的 VAR_PREFIX 也就地展开。
 * 新增一个 builder 函数即自动纳入校验；解析不出来则硬失败，逼维护者同步而不是静默放行。
 */

/** 去掉注释引导行：JSDoc 里抄写的 var(--x) 不是真实消费点 */
function withoutCommentLines(src) {
  return src
    .split('\n')
    .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line))
    .join('\n');
}

/** 收集 `const NAME = { ... } as const` 的顶层键 */
function objectKeys(objName, files) {
  const declRe = new RegExp(`(?:const|let)\\s+${objName}\\s*(?::[^=]*)?=\\s*\\{`);
  for (const src of files.values()) {
    const m = declRe.exec(src);
    if (!m) continue;
    const keys = [];
    let depth = 0;
    let i = m.index + m[0].length - 1;
    for (; i < src.length; i++) {
      const ch = src[i];
      if (ch === '{') {
        depth++;
        if (depth === 1) continue;
      } else if (ch === '}') {
        depth--;
        if (depth === 0) break;
      }
      if (depth !== 1) continue;
      const lineStart = src.lastIndexOf('\n', i) + 1;
      const lineEnd = src.indexOf('\n', i);
      const line = src.slice(lineStart, lineEnd === -1 ? src.length : lineEnd);
      const keyMatch = /^\s*([A-Za-z0-9_$'-]+)\s*:/.exec(line);
      if (keyMatch && !keys.includes(keyMatch[1].replace(/^['"]|['"]$/g, ''))) {
        keys.push(keyMatch[1].replace(/^['"]|['"]$/g, ''));
        i = lineEnd === -1 ? src.length : lineEnd;
      }
    }
    if (keys.length > 0) return keys;
  }
  return null;
}

/** 解析具名类型别名的取值集合（字面量联合 / keyof typeof / 别名转发） */
function resolveTypeValues(typeName, files, seen = new Set()) {
  if (seen.has(typeName)) return null;
  seen.add(typeName);
  const declRe = new RegExp(`(?:export\\s+)?type\\s+${typeName}\\s*=\\s*([^;]+);`, 's');
  for (const src of files.values()) {
    const m = declRe.exec(src);
    if (!m) continue;
    const rhs = m[1].replace(/\s+/g, ' ').trim();
    const keyofMatch = /keyof\s+typeof\s+([A-Za-z0-9_$]+)/.exec(rhs);
    if (keyofMatch) return objectKeys(keyofMatch[1], files);
    const literals = [...rhs.matchAll(/['"]([^'"]+)['"]|(\b\d+\b)/g)].map((x) => x[1] ?? x[2]);
    if (literals.length > 0 && /^[\s|'"0-9A-Za-z-]+$/.test(rhs)) return literals;
    if (/^[A-Za-z0-9_$]+$/.test(rhs)) {
      const nested = resolveTypeValues(rhs, files, seen);
      if (nested) return nested;
    }
  }
  return null;
}

/** 模板里 ${expr} 的取值集合：回溯最近一次 `expr: TYPE` 形参声明 */
function slotValues(expr, fileSrc, exprIndex, files) {
  // 支持两种写法：${level.toLowerCase()} 与 ${cssVarSuffix(token)}（camelCase → kebab-case）
  const callMatch = /([A-Za-z0-9_$]+)\s*\(\s*([A-Za-z0-9_$]+)\s*\)/.exec(expr);
  const kebab = /kebab|cssVarSuffix/i.test(expr);
  const toLower = kebab || /\.toLowerCase\(\)/.test(expr);
  const name = callMatch
    ? callMatch[2]
    : expr.replace(/\.toLowerCase\(\)/g, '').replace(/\(.*$/, '').trim();
  // 形参类型允许含 '|'（字面量联合），但不含逗号/左括号/换行；多形参签名与对象方法都靠这几个边界切开
  const paramRe = /([A-Za-z0-9_$]+)\s*:\s*([^,)(\n]+)/g;
  let type = null;
  for (const m of fileSrc.slice(0, exprIndex).matchAll(paramRe)) {
    if (m[1] === name) type = m[2];
  }
  if (!type) return { values: null, reason: `找不到形参 ${name} 的类型声明` };
  type = type.trim();
  let values = null;
  if (/^["']/u.test(type) || /^\d/u.test(type)) {
    values = [...type.matchAll(/['"]([^'"]+)['"]|(\b\d+\b)/g)].map((x) => x[1] ?? x[2]);
  } else if (/^[A-Za-z0-9_$]+$/.test(type)) {
    values = resolveTypeValues(type, files);
  }
  if (!values || values.length === 0) return { values: null, reason: `无法解析类型 ${type}` };
  if (!toLower) return { values, reason: '' };
  const mapped = values.map((v) =>
    kebab ? String(v).replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase() : String(v).toLowerCase(),
  );
  return { values: mapped, reason: '' };
}

/** 扫描 token 源码目录，返回 { names, unresolved } */
function synthesizedVarNames(tokenDir) {
  const files = new Map();
  const queue = [tokenDir];
  while (queue.length > 0) {
    const dir = queue.pop();
    let entries = [];
    try {
      entries = readdirSync(dir);
    } catch {
      continue;
    }
    for (const name of entries) {
      const full = join(dir, name);
      let st;
      try {
        st = statSync(full);
      } catch {
        continue;
      }
      if (st.isDirectory()) queue.push(full);
      else if (/\.(ts|mts)$/.test(name)) files.set(full, withoutCommentLines(readFileSync(full, 'utf8')));
    }
  }

  const names = new Set();
  const declared = new Set();
  const unresolved = [];
  for (const [file, src] of files) {
    // 同文件内的字符串常量，用于展开 `var(${VAR_PREFIX}-...)`
    const consts = new Map();
    for (const m of src.matchAll(/(?:const|let)\s+([A-Za-z0-9_$]+)\s*=\s*['"]([^'"]*)['"]/g)) {
      consts.set(m[1], m[2]);
    }
    for (const m of src.matchAll(/`([^`\n]*)`/g)) {
      const body = m[1];
      if (!body.includes('${')) continue;
      // 先展开同文件字符串常量，再判断是否涉及 --ydsz-：`var(${VAR_PREFIX}-easing-…)` 的静态串里并没有前缀
      const flat = body
        .split(/(\$\{[^}]*\})/)
        .map((p) => {
          const slot = /^\$\{([^}]*)\}$/.exec(p);
          return slot && consts.has(slot[1].trim()) ? consts.get(slot[1].trim()) : p;
        })
        .join('');
      if (!flat.includes('--ydsz-')) continue;
      if (!/var\(\s*--ydsz-/.test(flat)) {
        // 非 var() 形态即 JS 侧自己的声明（如 densityCSSVars 拼出的 --ydsz-density-*），计入定义
        for (const d of flat.matchAll(/(--ydsz-[a-z0-9-]+)(?![a-z0-9-])\s*:/g)) declared.add(d[1]);
        continue;
      }
      let ok = true;
      let acc = [''];
      for (const seg of flat.split(/(\$\{[^}]*\})/)) {
        const slot = /^\$\{([^}]*)\}$/.exec(seg);
        if (!slot) {
          acc = acc.map((prefix) => prefix + seg);
          continue;
        }
        // 只有紧跟在 `--ydsz-xxx-` 之后的槽才参与名字拼装；其余是取值槽，名字到此为止
        if (!acc.every((prefix) => /--ydsz-[a-z0-9-]*-$/.test(prefix))) break;
        const { values, reason } = slotValues(slot[1], src, m.index, files);
        if (!values) {
          unresolved.push(`${relative(tokenDir, file)}: \`${body}\` 的 ${slot[1]} — ${reason}`);
          ok = false;
          break;
        }
        acc = acc.flatMap((prefix) => values.map((v) => `${prefix}${v}`));
      }
      if (!ok) continue;
      for (const candidate of acc) {
        // 允许大写：JS 若直接插 camelCase key（未经 kebab 转换），必须原样报成未定义而不是被截断
        const nameMatch = /(--ydsz-[a-z0-9A-Z_-]+)(?![a-z0-9A-Z_-])/.exec(candidate);
        if (nameMatch && !nameMatch[1].endsWith('-')) names.add(nameMatch[1]);
      }
    }
  }
  return { names, declared, unresolved };
}

/** 扫描消费方源码的目录（docs-site 有自己的局部定义，单独处理） */
const SCAN_ROOTS = ['comm', 'main', 'apps'];
const SCAN_EXTS = new Set(['.vue', '.css', '.scss', '.ts', '.mts']);
const SKIP_DIRS = new Set(['node_modules', 'dist', 'coverage', '.git', '.vitepress', '.turbo']);

/** 收集待扫描文件 */
function walk(absDir, acc) {
  let entries = [];
  try {
    entries = readdirSync(absDir);
  } catch {
    return acc;
  }
  for (const name of entries) {
    const full = join(absDir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (!SKIP_DIRS.has(name)) walk(full, acc);
    } else if (SCAN_EXTS.has(extname(name))) {
      acc.push(full);
    }
  }
  return acc;
}

function readIf(file) {
  return existsSync(file) ? readFileSync(file, 'utf8') : '';
}

/** 提取 CSS 里声明的 `--ydsz-*` 变量名 */
function definedNames(css) {
  const set = new Set();
  for (const m of css.matchAll(/(--ydsz-[a-z0-9-]+)\s*:/g)) set.add(m[1]);
  return set;
}

/**
 * 主检查：返回失败项数组。
 *
 * @param {object} paths 各事实源路径（--self-test 会传入临时夹具）
 * @param {string} srcRoot 消费方源码扫描根
 */
function collectFailures(paths, srcRoot) {
  const failures = [];
  const warnings = [];

  const variablesSrc = readIf(paths.variables);
  const compatSrc = readIf(paths.compat);
  const globalSrc = readIf(paths.global);
  const entrySrc = readIf(paths.entry);
  const pkgSrc = readIf(paths.pkg);

  if (!variablesSrc) failures.push(`variables.css 缺失：${paths.variables}`);
  if (!compatSrc) failures.push(`compat-aliases.css 缺失：${paths.compat}`);

  // ---------- A. 接线（而非"文件存在"） ----------
  if (!/design-tokens\/styles\/variables\.css|variables\.css/.test(entrySrc)) {
    failures.push('base/design 的令牌入口未 import variables.css → 116 个 token 不会进入产物');
  }
  if (!/compat-aliases\.css/.test(entrySrc)) {
    failures.push('base/design 的令牌入口未 import compat-aliases.css → 历史命名仍取不到值');
  }
  if (!/"@ydsz-core\/design-tokens":\s*"workspace:\*"/.test(pkgSrc)) {
    failures.push('base/design 的 package.json 未声明 @ydsz-core/design-tokens 依赖 → 解析靠运气的幽灵依赖');
  }

  // ---------- D. 暗色选择器 ----------
  const darkBlock = /:root\.dark|\)\s*\n?\s*\.dark|\.dark[^{]*,/.test(variablesSrc);
  if (variablesSrc && !darkBlock) {
    failures.push(
      'variables.css 的暗色覆盖块未使用 .dark 类选择器：preferences 与 micro-kernel 两条主题链路写入 html[data-theme] 的词表不同（配色预设名 vs 模式名），唯一共同信号是 .dark 类',
    );
  }

  // ---------- 定义集合（CSS 静态定义 + JS 侧自声明的运行时变量，如 --ydsz-density-*） ----------
  const { names: synthesized, declared, unresolved } = synthesizedVarNames(paths.tokenSrc);
  const baseDefs = new Set([
    ...definedNames(variablesSrc),
    ...definedNames(compatSrc),
    ...definedNames(globalSrc),
    ...declared,
  ]);
  const docsDefs = new Set([...baseDefs, ...definedNames(readIf(paths.docsCustomCss))]);

  // ---------- B. 消费方静态引用 ----------
  const consumerRoots = srcRoot ? [srcRoot] : SCAN_ROOTS.map((d) => join(ROOT_DIR, d));
  const files = [];
  for (const dir of consumerRoots) walk(dir, files);

  const used = new Map();
  for (const file of files) {
    const src = withoutCommentLines(readFileSync(file, 'utf8'));
    if (!src) continue;
    for (const m of src.matchAll(/var\((--ydsz-[a-z0-9-]+)(?![a-z0-9-])/g)) {
      const name = m[1];
      // 模板拼接产生的残名前缀（结尾是 '-'）交给 C 项处理
      if (name.endsWith('-')) continue;
      if (!used.has(name)) used.set(name, file);
    }
  }

  for (const [name, file] of used) {
    const inDocs = relative(ROOT_DIR, file).startsWith(join('apps', 'docs-site'));
    const defs = inDocs ? docsDefs : baseDefs;
    if (!defs.has(name)) {
      failures.push(`未定义的令牌 ${name}（首个引用：${relative(ROOT_DIR, file)}）`);
    }
  }

  // ---------- C. JS 侧模板拼出的变量名 ----------
  for (const item of unresolved) {
    failures.push(`无法枚举模板变量取值（门禁需补解析规则，不可放行）：${item}`);
  }
  for (const name of [...synthesized].sort()) {
    if (!baseDefs.has(name)) {
      failures.push(`JS 侧会拼出 ${name}，但 CSS 未定义 → 运行期取空值`);
    }
  }

  // ---------- E. 产物级验证 ----------
  const distCss = readIf(paths.dist);
  if (distCss) {
    const distDefs = definedNames(distCss);
    const missing = [...definedNames(variablesSrc)].filter((n) => !distDefs.has(n));
    if (missing.length > 0) {
      failures.push(
        `dist/design.css 缺少 ${missing.length} 个令牌定义（例：${missing.slice(0, 3).join(', ')}）——` +
          '源码 import 存在但被库构建 external 掉，就是 S7 的原始形态',
      );
    }
  }

  // ---------- F. 别名是否仍在被使用 ----------
  const compatNames = [...definedNames(compatSrc)];
  const deadAliases = compatNames.filter((n) => !used.has(n));
  if (deadAliases.length > 0) {
    warnings.push(`compat-aliases.css 中 ${deadAliases.length} 个别名已无消费方，可删除：${deadAliases.join(', ')}`);
  }

  return {
    failures,
    warnings,
    synthesized,
    usedCount: used.size,
    defCount: baseDefs.size,
  };
}

/** 反例夹具：证明 A/B/C 各项确实会红 */
function selfTest() {
  const dir = mkdtempSync(join(tmpdir(), 'ydsz-tokens-selftest-'));
  try {
    const stylesDir = join(dir, 'styles');
    const srcDir = join(dir, 'src');
    const tokenDir = join(dir, 'tokens');
    for (const sub of [stylesDir, srcDir, tokenDir]) mkdirSync(sub, { recursive: true });

    // --ydsz-fake-ok-ok 由 JS 模板拼出（应通过）；--ydsz-fake-missing-* 故意不给定义
    writeFileSync(
      join(stylesDir, 'variables.css'),
      ':root { --ydsz-color-brand-500: 222 47% 44%; --ydsz-fake-ok-ok: 1px; }\n',
      'utf8',
    );
    writeFileSync(join(stylesDir, 'compat-aliases.css'), ':root { --ydsz-comp-bg: var(--ydsz-color-brand-500); }\n', 'utf8');
    writeFileSync(join(dir, 'global.css'), '', 'utf8');
    // 入口故意不 import；消费方故意引用未定义令牌
    writeFileSync(join(dir, 'entry.ts'), "import './default.css';\nexport {};\n", 'utf8');
    writeFileSync(join(dir, 'package.json'), '{"name":"@ydsz-core/design","dependencies":{}}\n', 'utf8');
    writeFileSync(join(dir, 'docs.css'), '', 'utf8');
    writeFileSync(
      join(srcDir, 'widget.vue'),
      '<style>.a{color:var(--ydsz-nope);padding:var(--ydsz-density-fake-padding)}</style>\n',
      'utf8',
    );

    writeFileSync(
      join(tokenDir, 'fake.ts'),
      [
        "export type OkLevel = 'ok';",
        "export type BadLevel = 'missing';",
        'export type UnknownLevel = SomeOtherType;',
        "const PREFIX = '--ydsz-fake';",
        'export function okVar(level: OkLevel): string {',
        '  return `var(${PREFIX}-ok-${level})`;',
        '}',
        'export function badVar(level: BadLevel): string {',
        '  return `var(--ydsz-fake-missing-${level})`;',
        '}',
        'export function unknownVar(x: UnknownLevel): string {',
        '  return `var(--ydsz-fake-unknown-${x})`;',
        '}',
        'export function densityBlock(t: DensityTokens): string {',
        '  return `--ydsz-density-fake-padding: ${t.padding}px;`;',
        '}',
        '',
      ].join('\n'),
      'utf8',
    );

    const { failures, synthesized } = collectFailures(
      {
        variables: join(stylesDir, 'variables.css'),
        compat: join(stylesDir, 'compat-aliases.css'),
        global: join(dir, 'global.css'),
        entry: join(dir, 'entry.ts'),
        pkg: join(dir, 'package.json'),
        dist: join(dir, 'nope.css'),
        docsCustomCss: join(dir, 'docs.css'),
        tokenSrc: tokenDir,
      },
      srcDir,
    );

    const required = [
      ['A 入口未 import', '未 import variables.css'],
      ['B 未定义令牌', '未定义的令牌 --ydsz-nope'],
      ['C 模板拼出的名字缺定义', 'JS 侧会拼出 --ydsz-fake-missing-missing'],
      ['C 类型枚举不出来则失败', '无法枚举模板变量取值'],
    ];
    const missed = required.filter(([, needle]) => !failures.some((f) => f.includes(needle)));
    if (missed.length > 0) {
      console.error('❌ 门禁自检失败：反例未被下列检查捕获，说明检查已空转：');
      for (const [name] of missed) console.error(`  - ${name}`);
      console.error(`  实际检出 ${failures.length} 条：`);
      for (const f of failures) console.error(`    · ${f}`);
      process.exit(1);
    }
    // 正向断言：常量前缀展开 + JS 自声明变量计入定义，两者一旦被改坏必须报错
    if (!synthesized.has('--ydsz-fake-ok-ok')) {
      console.error('❌ 门禁自检失败：okVar 未枚举到 --ydsz-fake-ok-ok，说明 VAR_PREFIX 常量展开失效');
      process.exit(1);
    }
    if (failures.some((f) => f.includes('--ydsz-density-fake-padding'))) {
      console.error('❌ 门禁自检失败：JS 侧自己声明的 --ydsz-density-fake-padding 被误判为未定义');
      process.exit(1);
    }
    console.log(`✅ 门禁自检通过：反例命中 ${required.length}/${required.length} 类缺陷（检出 ${failures.length} 条）`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// ---------- 主流程 ----------
if (process.argv.includes('--self-test')) {
  selfTest();
} else {
  const { failures, warnings, usedCount, defCount, synthesized } = collectFailures(
    {
      variables: VARIABLES_CSS,
      compat: COMPAT_CSS,
      global: GLOBAL_CSS,
      entry: TOKEN_ENTRY,
      pkg: DESIGN_PKG,
      dist: DESIGN_DIST,
      docsCustomCss: DOCS_CUSTOM_CSS,
      tokenSrc: TOKEN_SRC,
    },
    null,
  );
  const synthCount = synthesized.size;

  for (const w of warnings) console.warn(`⚠️  ${w}`);

  if (failures.length > 0) {
    console.error(`❌ 设计令牌接线检查未通过（定义 ${defCount} 个 / 消费 ${usedCount} 个 / JS 拼出 ${synthCount} 个）：`);
    for (const f of failures) console.error(`  - ${f}`);
    console.error('  接线位置：comm/@core/base/design/src/design-tokens/index.ts');
    process.exit(1);
  }

  const built = existsSync(DESIGN_DIST) ? '含产物级 design.css 校验' : '（base/design 未构建，跳过产物级校验）';
  console.log(
    `✅ 设计令牌接线通过：${defCount} 个定义覆盖 ${usedCount} 个静态消费名 + ${synthCount} 个 JS 模板拼出名；${built}`,
  );
}
