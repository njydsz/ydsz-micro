#!/usr/bin/env node
/**
 * 依赖声明 + 入口可达性门禁 —— 防止 B0-10 类"生产构建解析失败"再次发生。
 *
 * 覆盖同一后果（隔离安装下 `vite build` 报 Failed to resolve）的两条独立成因：
 *   规则 A：源码 import 了本包没声明的依赖；
 *   规则 B：package.json 的入口/导出指向一个永远不会存在的产物（该包根本没有 build 脚本）。
 *
 * 背景（实测复现，不是推断）：
 *   `pnpm -F @ydsz/userinfo-web run build` 失败于
 *   `[vite]: Rollup failed to resolve import "lucide-vue-next" from apps/userinfo-web/src/views/system/user-preference/index.vue`。
 *   根因：`lucide-vue-next` 只被 4 个库包声明（`@ydsz-core/icons`、`@ydsz-core/ydsz-ui`、
 *   `@ydsz/common-ui`、`@ydsz/shared-business`），而 5 个子应用 + `main` 的 16 个源文件
 *   直接 `from 'lucide-vue-next'`。pnpm 默认隔离 node_modules（仓库未开 hoist / nohoist），
 *   未声明即不存在符号链接，Rollup 解析失败；dev server 之所以看起来正常，是因为它把请求
 *   交给了已声明该依赖的库模块图。这类缺陷的特点是：**只在生产构建红，本地永远看不出来**，
 *   而 CI 从未跑子应用构建（见报告 B0-10 结论），于是一路漂到发布前。
 *
 * 判据 A（对每个 workspace 包）：源文件里出现的每一个"裸模块说明符"（bare specifier），
 * 其包名必须出现在该包 package.json 的 dependencies / devDependencies /
 * peerDependencies / optionalDependencies 之一。workspace 内部包同样要求声明——
 * 少一个 `workspace:*` 就少一个符号链接，后果与第三方一致。
 *
 * 判据 B（对每个 workspace 包）：生产期会被选中的入口必须真实存在——顶层 main/module/browser，
 * exports 里 default/import/require/node/browser/module/production 条件下的目标，以及通配导出
 * `./x/*` 的目录前缀。若本包有 build/stub 脚本，产物只是"本地还没跑出来"，CI 的 turbo build
 * 会先生产它（`dependsOn: ["^build"]`），不算缺陷；**无脚本却指向 dist 是"永远不会存在"**，
 * 必须报错。本仓用"注释掉的键"表示入口已显式停用（`#build`、`#default`、`//default`），
 * 这类键一律不检查——冤枉合法提交的门禁，下一轮就会被加白名单关掉。
 *
 * 分级（只有"会真的让打包器解析失败"的才算错误，否则门禁会被当成噪声关掉）：
 *   错误：source 文件里的值引用（`import x from` / `export … from` / `import()` / `require()`）；
 *         无 build/stub 脚本的包里，生产期入口指向不存在的文件或目录。
 *   警告：仅出现在 `*.config.*`（含 `vite.config.<变体>.mts`）与包级 `build.mts` —— 这类由 Node
 *         从仓库根向上解析，靠根 devDependencies 兜得住，属"隐式提升"债而非构建阻断；
 *         仅出现在故事文件（本仓未接入 Storybook）；仅出现在测试文件；
 *         纯 `import type`/`export type`（打包期被擦除，但 vue-tsc/dts 要解析）；
 *         `#xxx` 说明符（由 package.json imports 或消费端构建别名解析，永远不查 node_modules）；
 *         只有 `types`/`development` 条件指向不存在的文件（影响 vue-tsc 与 dts，不进产物）；
 *         `files` 只声明 dist 却没有任何 build 脚本（发布轨会打出空包）。
 *
 * 说明符过滤（不得误报）：相对路径、`@/` `#/` `~/` 别名、package.json imports 里登记过的 `#别名`、
 * `?raw|?url` 等资源查询、非 JS 扩展名、`node:` 与 Node 内置模块、自引用包名。
 * 注释与模板字符串在提取前剔除：`bash/gen-app.mts` 的脚手架模板里有整段 import 语句，
 * 那是**生成物的源码**而不是本文件的依赖，若计入就会把门禁变成噪声源。
 *
 * 用法：
 *   node ./bash/check-declared-deps.mts                 # 校验全仓
 *   node ./bash/check-declared-deps.mts --list-packages  # 只打印扫描到的包（排障用）
 *   node ./bash/check-declared-deps.mts --self-test      # 用夹具证明门禁会拦、且不冤枉
 *
 * @path bash/check-declared-deps.mts
 * @author ydsz-team
 * @since 4.5.0
 */

import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { builtinModules } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** 不参与依赖图分析的目录（产物、缓存、测试输出、静态资源） */
const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  '.turbo',
  'coverage',
  'test-results',
  'playwright-report',
  '.output',
  '.nuxt',
  '.vite',
  'public',
  'assets',
]);

/** 源文件扩展名：这些才会产生 import */
const SOURCE_EXT = /\.(?:ts|mts|cts|js|mjs|cjs|tsx|jsx|vue)$/;

const NODE_BUILTINS = new Set([...builtinModules, ...builtinModules.map((m) => `node:${m}`)]);

/** 文件用途严重度序：同一依赖在多种用途里出现时，取最严重的那个作为分级依据 */
const KIND_SEVERITY = { config: 1, story: 2, test: 3, source: 4 };

/** 说明符里允许直接放行的前缀（别名/相对/绝对路径） */
const SKIPPED_PREFIXES = ['.', '/', '@/', '#/', '~/'];

/**
 * 读取 pnpm-workspace.yaml 的 packages 模式。
 *
 * 不依赖第三方 yaml 解析器：本仓的 packages 段就是 `- 'x'` 列表，逐行取即可；
 * 解析不出任何模式时必须报错（静默返回空 = 门禁永远绿灯）。
 *
 * @param {string} workspaceFile pnpm-workspace.yaml 路径
 * @returns {string[]} glob 模式
 */
function readWorkspaceGlobs(workspaceFile) {
  if (!existsSync(workspaceFile)) throw new Error(`pnpm-workspace.yaml 缺失：${workspaceFile}`);
  const lines = readFileSync(workspaceFile, 'utf8').split(/\r?\n/);
  const globs = [];
  let inPackages = false;
  for (const line of lines) {
    if (/^packages:\s*$/.test(line)) {
      inPackages = true;
      continue;
    }
    if (inPackages) {
      if (/^\s*-\s*['"]?([^'"\s#]+)['"]?\s*$/.test(line)) {
        globs.push(line.match(/^\s*-\s*['"]?([^'"\s#]+)['"]?\s*$/)[1]);
        continue;
      }
      if (line.trim() !== '' && !/^\s/.test(line)) break;
    }
  }
  if (globs.length === 0) throw new Error('pnpm-workspace.yaml 未解析出任何 packages 模式（门禁会空转，拒绝继续）');
  return globs;
}

/** 把单一 `*` 段展开为实际目录（只支持本仓用到的单层通配） */
function expandGlob(root, pattern) {
  if (!pattern.includes('*')) return [join(root, pattern)];
  const parts = pattern.split('/');
  let current = [root];
  for (const part of parts) {
    if (!part.includes('*')) {
      current = current.map((dir) => join(dir, part));
      continue;
    }
    const prefix = part.replace(/\*/g, '');
    const next = [];
    for (const dir of current) {
      if (!existsSync(dir)) continue;
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        if (prefix === '' || entry.name.startsWith(prefix)) next.push(join(dir, entry.name));
      }
    }
    current = next;
  }
  return current;
}

/**
 * 枚举 workspace 包。
 *
 * @param {string} root 仓库根
 * @returns {{name: string, dir: string, json: Record<string, any>, declared: Set<string>, subpathAliases: Set<string>}[]}
 */
function readPackages(root) {
  const globs = readWorkspaceGlobs(join(root, 'pnpm-workspace.yaml'));
  const seen = new Set();
  const pkgs = [];
  for (const pattern of globs) {
    for (const dir of expandGlob(root, pattern)) {
      const manifest = join(dir, 'package.json');
      if (!existsSync(manifest)) continue;
      const real = resolve(dir);
      if (seen.has(real)) continue;
      seen.add(real);
      let json;
      try {
        json = JSON.parse(readFileSync(manifest, 'utf8'));
      } catch (error) {
        throw new Error(`${relative(root, manifest)} 解析失败：${error.message}`);
      }
      if (!json.name) throw new Error(`${relative(root, manifest)} 缺少 name 字段`);
      const declared = new Set();
      for (const field of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
        for (const key of Object.keys(json[field] ?? {})) declared.add(key);
      }
      // package.json 的 imports 字段是 `#xxx` 说明符的权威声明处（Node 原生子路径别名）
      const subpathAliases = new Set(Object.keys(json.imports ?? {}));
      pkgs.push({ name: json.name, dir: real, json, declared, subpathAliases });
    }
  }
  return pkgs.sort((a, b) => a.dir.localeCompare(b.dir));
}

/**
 * 剔除注释与模板字符串。
 *
 * @param {string} code 源码
 * @param {string} file 文件路径（.vue 需另处理 HTML 注释）
 * @returns {string} 仅保留真实代码文本
 */
function stripNonCode(code, file) {
  let out = code;
  if (file.endsWith('.vue')) out = out.replace(/<!--[\s\S]*?-->/g, '');
  out = out.replace(/\/\*[\s\S]*?\*\//g, '');
  // 行注释：只按"行首或空格后 // 且不在 http:// 这类值里"处理，模板字符串已先被剔除
  out = out.replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
  out = out.replace(/`(?:\\.|[^`\\])*`/g, '``');
  return out;
}

/**
 * 抽取一个源文件里的全部裸说明符。
 *
 * `import type` / `export type` 单独标记：类型说明符在构建期被完全擦除，不会让打包器
 * 解析失败（但会让 vue-tsc / dts 生成失败），因此归入另一级严重度。
 *
 * @param {string} code 已去注释的源码
 * @returns {{spec: string, typeOnly: boolean}[]}
 */
function extractSpecifiers(code) {
  const patterns = [
    { re: /(?:^|[\s;}])import\s+(type\s+)?(?:[^'"();]*?)\s*from\s*['"]([^'"]+)['"]/g, spec: 2, type: 1 },
    { re: /(?:^|[\s;}])import\s*['"]([^'"]+)['"]/g, spec: 1, type: null },
    { re: /(?:^|[\s;}])export\s+(type\s+)?(?:[^'"();]*?)\s*from\s*['"]([^'"]+)['"]/g, spec: 2, type: 1 },
    { re: /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g, spec: 1, type: null },
    { re: /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g, spec: 1, type: null },
  ];
  const found = new Map();
  for (const { re, spec, type } of patterns) {
    let m;
    while ((m = re.exec(code)) !== null) {
      const name = m[spec];
      const typeOnly = type === null ? false : Boolean(m[type]);
      const prev = found.get(name);
      // 同一说明符既出现在类型位也出现在值位时，按"值"处理（从严）
      found.set(name, { spec: name, typeOnly: prev ? prev.typeOnly && typeOnly : typeOnly });
    }
  }
  return [...found.values()];
}

/**
 * 文件用途分类，决定未声明依赖的严重度。
 *
 * - config：构建/工具配置（`*.config.*`，含 `vite.config.<变体>.mts`；以及包级 `build.mts`），
 *   由 Node 在仓库根向上解析，当前靠根 package.json 的 devDependencies 兜底能跑通
 *   —— 属"隐式提升"债，不是构建阻断；
 * - story：`*.story.*` / `*.stories.*` 与 `story|stories` 目录下的文件。本仓没有接入 Storybook
 *   （既无 `.storybook/` 也无任何 `@storybook/*` 依赖），这些文件不进任何构建图；
 * - test：`*.test.*` / `*.spec.*` / `__tests__/` / `tests/`，不进应用产物；
 * - source：进入打包图，未声明即 Rollup 解析失败（B0-10 的真实形态）。
 *
 * @param {string} file 绝对路径
 * @returns {'config'|'story'|'test'|'source'}
 */
function classifyFile(file) {
  // 这里不用"反斜杠+斜杠"的正则字符类：本函数原先写的分隔符类少了一个闭合括号，
  // 正则在运行时退化成"匹配字符集里的任意单个字符"，于是所有源文件都被判成测试文件，
  // 构建阻断级缺陷被降级成警告（门禁假绿）。改用字符串 API 拆段，彻底避开该类写法。
  const segments = file.replaceAll('\\', '/').split('/').filter(Boolean);
  const name = segments.at(-1) ?? file;
  const isConfig =
    /^build\.(?:mts|cts|ts|js|mjs|cjs)$|\.config(?:\.\w+)*\.(?:mts|cts|ts|js|mjs|cjs)$/.test(name);
  const isStoryName = /\.(?:story|stories)\.(?:ts|mts|cts|tsx|js|mjs|cjs|jsx|vue)$/.test(name);
  const isTestName = /\.(?:test|spec)\.(?:ts|mts|cts|js|mjs|tsx)$/.test(name);
  const inStoryDir = segments.some((s) => s === 'story' || s === 'stories');
  const inTestDir = segments.some((s) => s === '__tests__' || s === 'tests');
  if (isConfig) return 'config';
  if (isStoryName || inStoryDir) return 'story';
  if (isTestName || inTestDir) return 'test';
  return 'source';
}

/** `@scope/name/sub` → `@scope/name`；`name/sub` → `name` */
function packageNameOf(specifier) {
  const clean = specifier.split('?')[0];
  const segments = clean.split('/');
  return clean.startsWith('@') ? segments.slice(0, 2).join('/') : segments[0];
}

/** 该说明符是否属于"不该由依赖声明负责"的类别 */
function isIgnorableSpecifier(specifier, selfName) {
  if (SKIPPED_PREFIXES.some((p) => specifier.startsWith(p))) return true;
  if (/\.(?:css|scss|less|svg|png|jpe?g|gif|webp|woff2?|ttf|json|ya?ml|md|txt|mp4|glb)$/i.test(specifier.split('?')[0])) {
    return true;
  }
  if (specifier.includes('?') && /(^|[?&])(raw|url|worker|inline|import|default)\b/.test(specifier)) return true;
  const pkg = packageNameOf(specifier);
  if (pkg === selfName) return true;
  if (NODE_BUILTINS.has(pkg) || pkg.startsWith('node:')) return true;
  return false;
}

/**
 * `#xxx` 说明符是否由本包 package.json 的 imports 字段授权。
 *
 * Node 的 rules：key 要么精确匹配（`#app`），要么是通配（`#internal/*`）。
 *
 * @param {string} specifier 以 # 开头的说明符
 * @param {Set<string>} aliases 本包 imports 的 key 集合
 * @returns {boolean}
 */
function isDeclaredSubpathAlias(specifier, aliases) {
  for (const key of aliases) {
    if (key === specifier) return true;
    if (key.endsWith('/*') && specifier.startsWith(key.slice(0, -1))) return true;
  }
  return false;
}

/** 生产构建会选中的导出条件：这些条件下的目标缺失 = `vite build --mode production` 必红 */
const PRODUCTION_CONDITIONS = new Set([
  'default',
  'import',
  'require',
  'node',
  'node-addons',
  'module',
  'module-sync',
  'browser',
  'production',
]);

/** 只影响类型解析与开发期的条件：缺失影响 vue-tsc / dts，不进产物，故降级为警告 */
const DEV_ONLY_CONDITIONS = new Set(['types', 'development']);

/**
 * 本仓的"注释掉的键"约定：`#build`、`#default`、`//default` 表示作者显式停用该入口/脚本。
 * 这些键指向的文件按定义不存在，检查它们只会制造冤枉报告。
 *
 * @param {string} key package.json 的键名
 * @returns {boolean}
 */
function isParkedKey(key) {
  return key.startsWith('#') || key.startsWith('//');
}

/**
 * 收集一个包的全部入口目标（顶层字段 + exports 条件树）。
 *
 * @param {Record<string, any>} json package.json 解析结果
 * @returns {{field: string, condition: string, target: string}[]}
 */
function collectEntryTargets(json) {
  /** @type {{field: string, condition: string, target: string}[]} */
  const out = [];
  const push = (node, field, devAncestor) => {
    if (typeof node === 'string') {
      out.push({ field, condition: devAncestor ? 'types' : 'default', target: node });
      return;
    }
    if (Array.isArray(node)) {
      for (const item of node) push(item, field, devAncestor);
      return;
    }
    if (!node || typeof node !== 'object') return;
    for (const [key, value] of Object.entries(node)) {
      if (isParkedKey(key)) continue;
      const isDev = DEV_ONLY_CONDITIONS.has(key);
      if (typeof value === 'string' || Array.isArray(value)) {
        push(value, `${field}[${key}]`, devAncestor || isDev);
      } else {
        push(value, `${field}[${key}]`, devAncestor || isDev);
      }
    }
  };
  for (const field of ['main', 'module', 'browser', 'types']) {
    if (json[field] !== undefined) push(json[field], field, field === 'types');
  }
  // exports 顶层键是子路径（不是条件），先剥掉一层再进条件树
  if (json.exports !== undefined) {
    if (typeof json.exports === 'string') {
      out.push({ field: 'exports', condition: 'default', target: json.exports });
    } else if (!Array.isArray(json.exports)) {
      for (const [subpath, node] of Object.entries(json.exports)) {
        if (isParkedKey(subpath)) continue;
        push(node, `exports["${subpath}"]`, false);
      }
    }
  }
  return out;
}

/**
 * 入口目标是否真实存在。
 *
 * 通配目标（`./src/components/*/index.ts`）无法逐文件校验，只校验 `*` 之前的目录前缀：
 * 前缀目录不存在才是真断了（消费方任何子路径都解析不到）。
 *
 * @param {string} pkgDir 包目录绝对路径
 * @param {string} target 相对目标
 * @returns {boolean}
 */
function entryTargetExists(pkgDir, target) {
  if (!target.startsWith('.')) return true;
  if (!target.includes('*')) return existsSync(join(pkgDir, target));
  const head = target.slice(0, target.indexOf('*'));
  const dir = head.endsWith('/') ? head : head.replace(/\/[^/]*$/, '');
  return existsSync(join(pkgDir, dir || '.'));
}

/**
 * 规则 B —— 入口可达性：生产期会被选中的入口必须存在。
 *
 * @param {string} root 仓库根
 * @param {{name: string, dir: string, json: Record<string, any>}} pkg 包信息
 * @returns {{errors: string[], warnings: string[]}}
 */
function checkPackageEntries(root, pkg) {
  const errors = [];
  const warnings = [];
  const json = pkg.json;
  const scripts = json.scripts ?? {};
  // 有 build/stub 脚本时，dist 只是"本地还没跑"，CI 的 turbo build（dependsOn ^build）会先生产它
  const buildable = Boolean(scripts.build || scripts.stub);
  const head = `${pkg.name}（${relative(root, pkg.dir)}）`;

  /** 同一产物常被 main 与 exports[...].default 同时指向，按目标合并成一条，避免重复刷屏 */
  const missingProd = new Map();
  for (const { field, condition, target } of collectEntryTargets(json)) {
    if (entryTargetExists(pkg.dir, target)) continue;
    const isProduction = PRODUCTION_CONDITIONS.has(condition);
    if (!isProduction || buildable) {
      if (!isProduction && !buildable) {
        warnings.push(
          `${head}的 ${field} 指向不存在的 "${target}"（条件 ${condition} 只影响类型/开发期）。` +
            `不进产物，但 vue-tsc 与 dts 生成会失败；应改指 ./src/... 或补 build 脚本。`,
        );
      }
      continue;
    }
    if (!missingProd.has(target)) missingProd.set(target, { fields: [], isPattern: target.includes('*') });
    missingProd.get(target).fields.push(field);
  }
  for (const [target, info] of missingProd) {
    errors.push(
      `${head}的生产期入口 ${info.fields.join(' / ')} 指向 "${target}"，但该${info.isPattern ? '目录前缀' : '文件'}不存在，` +
        `且本包没有任何 build/stub 脚本 —— 这个产物永远不会存在。` +
        `dev 走 development/types 条件命中 src 所以本地正常，` +
        `vite build --mode production 走 default 条件即报 "Failed to resolve entry for package"。` +
        `修法（二选一）：把 main/module/exports.*.default 改指 ./src/...（本仓 @ydsz-core/ui、` +
        `@ydsz-core/editor-ui 就是源码直发形态），或补 build 脚本（pnpm unbuild）并纳入 turbo build 图。`,
    );
  }
  const files = Array.isArray(json.files) ? json.files : [];
  if (!buildable && files.length > 0 && files.includes('dist') && !files.includes('src')) {
    warnings.push(
      `${head}的 files 只声明 "dist" 但没有任何 build/stub 脚本：` +
        `npm pack / publish 会产出空包。发布轨接通前，应把 files 改为 ["src"]（与源码直发的包一致）。`,
    );
  }
  return { errors, warnings };
}

/** 递归列出包内源文件 */
function listSourceFiles(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
      listSourceFiles(join(dir, entry.name), acc);
    } else if (entry.isFile() && SOURCE_EXT.test(entry.name) && !entry.name.endsWith('.min.js')) {
      acc.push(join(dir, entry.name));
    }
  }
  return acc;
}

/**
 * 全仓扫描。
 *
 * @param {string} root 仓库根
 * @param {{strict?: boolean}} [options] strict 时把警告也计入失败
 * @returns {{packages: number, files: number, violations: string[], warnings: string[], packageNames: string[]}}
 */
function scan(root, options = {}) {
  const packages = readPackages(root);
  const violations = [];
  const warnings = [];
  let fileCount = 0;
  for (const pkg of packages) {
    const files = listSourceFiles(pkg.dir);
    fileCount += files.length;
    /** @type {Map<string, {files: Set<string>, typeOnly: boolean, kind: 'config'|'story'|'test'|'source'}>} */
    const bad = new Map();
    /** 未经 imports 声明的 `#xxx` 说明符 → 命中文件（单独分级，见下方说明） */
    const hashSpecs = new Map();
    for (const file of files) {
      const kind = classifyFile(file);
      let code;
      try {
        code = stripNonCode(readFileSync(file, 'utf8'), file);
      } catch (error) {
        violations.push(`${relative(root, file)} 读取失败：${error.message}`);
        continue;
      }
      for (const { spec, typeOnly } of extractSpecifiers(code)) {
        if (isIgnorableSpecifier(spec, pkg.name)) continue;
        // `#xxx` 由 Node 的 imports 字段或消费端构建别名解析，永远不查 node_modules，
        // 所以它不属于"隔离 node_modules 下生产构建必红"这一类；未在 imports 里登记的记为警告。
        if (spec.startsWith('#')) {
          if (!isDeclaredSubpathAlias(spec, pkg.subpathAliases)) {
            if (!hashSpecs.has(spec)) hashSpecs.set(spec, new Set());
            hashSpecs.get(spec).add(relative(root, file));
          }
          continue;
        }
        const pkgName = packageNameOf(spec);
        if (pkg.declared.has(pkgName)) continue;
        if (!bad.has(pkgName)) bad.set(pkgName, { files: new Set(), typeOnly: true, kind });
        const entry = bad.get(pkgName);
        entry.files.add(relative(root, file));
        if (!typeOnly) entry.typeOnly = false;
        // 取最坏：一个依赖只要被某个 source 文件按值引用过，就是构建错误。
        // 初值必须是"当前文件的 kind"而不是硬编码 source —— 否则只在 vite.config/测试里
        // 出现的依赖会被误升级成构建错误，把不阻断产物分级成阻断级（--self-test 抓到过这条）。
        if (KIND_SEVERITY[kind] > KIND_SEVERITY[entry.kind]) entry.kind = kind;
      }
    }
    const declaredHint = pkg.declared.size > 0 ? `本包已声明 ${pkg.declared.size} 项` : '本包未声明任何依赖';
    const where = (set) => {
      const list = [...set];
      return `${list.slice(0, 3).join(', ')}${list.length > 3 ? ` …（共 ${list.length}）` : ''}`;
    };
    for (const [pkgName, info] of bad) {
      const head =
        `${pkg.name}（${relative(root, pkg.dir)}）import 了未声明依赖 "${pkgName}" —— ${declaredHint}。` +
        `命中 ${info.files.size} 个文件：${where(info.files)}。`;
      if (info.kind === 'config') {
        warnings.push(
          `${head}配置/工具文件当前靠仓库根 devDependencies 向上解析才没报错（隐式提升），` +
            `根依赖一旦调整即中断；应在此包 devDependencies 显式声明 "${pkgName}": "workspace:*" 或 "catalog:"。`,
        );
        continue;
      }
      if (info.kind === 'story') {
        warnings.push(
          `${head}只出现在故事文件；本仓未接入 Storybook（无 .storybook/、无 @storybook/* 依赖），` +
            `这些文件目前不进任何构建图，因此不阻断构建；但接入 Storybook 前必须先在 devDependencies ` +
            `补上 "${pkgName}"，否则 pnpm storybook 立刻解析失败。`,
        );
        continue;
      }
      if (info.kind === 'test') {
        warnings.push(
          `${head}仅出现在测试文件，不进应用产物；应在该包 devDependencies 显式声明，` +
            `否则按包跑 vitest（pnpm -F 本包 test）时会解析失败。`,
        );
        continue;
      }
      if (info.typeOnly) {
        warnings.push(
          `${head}全部为 \`import type\`/\`export type\`，打包期会被擦除因此不阻断构建，` +
            `但 vue-tsc 与 dts 生成必须解析它；且这通常意味着跨层类型依赖，应改为从合适的包取类型。`,
        );
        continue;
      }
      violations.push(
        `${head}pnpm 隔离 node_modules 下未声明即无法解析：dev server 可能正常，生产构建必红。` +
          `修法：在该包 package.json 加 "${pkgName}": "catalog:"（第三方）或 "workspace:*"（内部包），` +
          `或改由已声明该依赖的 workspace 包透出。`,
      );
    }
    for (const [spec, hitFiles] of hashSpecs) {
      warnings.push(
        `${pkg.name}（${relative(root, pkg.dir)}）使用了未在 package.json imports 中登记的 "${spec}"。` +
          `命中 ${hitFiles.size} 个文件：${where(hitFiles)}。` +
          `它以 # 开头，不经 node_modules 解析（pnpm 隔离对它无影响），因此不阻断构建，` +
          `但只有"本包 imports 字段"或"消费端构建别名（如 Nuxt 注入的 #app）"能解析它；` +
          `请二选一：在 imports 里显式登记，或确认这是消费端别名并在注释里写明来源。`,
      );
    }
    // 规则 B：入口可达性 —— 与规则 A 同一个后果（生产构建解析失败）的第二种成因，
    // 只在 package.json 层，不看源文件，因此不受源文件过滤规则影响。
    const entries = checkPackageEntries(root, pkg);
    violations.push(...entries.errors);
    warnings.push(...entries.warnings);
  }
  return {
    packages: packages.length,
    files: fileCount,
    violations: options.strict ? [...violations, ...warnings] : violations,
    warnings,
    packageNames: packages.map((p) => `${p.name} @ ${relative(root, p.dir)}`),
  };
}

// ---------- 自检夹具 ----------

/**
 * 构造一个最小 workspace：
 *   good  —— 说明符全部已声明（含 workspace 包、scoped 子路径、node: 内置、相对/别名）
 *   bad   —— 未声明的第三方 + 未声明的 workspace 包，另附一段模板字符串里的 import
 *            （必须不被计入，否则脚手架生成器会变成噪声源）
 * @param {string} root 临时根目录
 */
function writeFixture(root) {
  const files = {
    'pnpm-workspace.yaml': "packages:\n  - 'pkgs/*'\n",
    'pkgs/good/package.json': JSON.stringify({
      name: '@t/good',
      dependencies: { 'left-pad': '1.0.0', '@t/dep': 'workspace:*', 'echarts-stat': '1.2.0' },
      imports: { '#self-alias': './src/alias.ts' },
    }),
    'pkgs/good/src/index.ts': [
      "import { trim } from 'left-pad';",
      "import type { X } from 'echarts-stat/dist/types';",
      "import { thing } from '@t/dep';",
      "import * as fs from 'node:fs';",
      "import css from './style.css';",
      "import raw from '../assets/x.json?raw';",
      "import worker from 'comlink/worker?worker';",
      "import { alias } from '@/alias';",
      "import { declared } from '#self-alias';",
      "import { inner } from '#/inner';",
      "import '@t/good/self-side-effect';",
      "export { thing, declared, inner, alias, css, raw, worker, fs, trim, X };",
      "// import shouldBeIgnored from 'commented-out';",
    ].join('\n'),
    'pkgs/bad/package.json': JSON.stringify({ name: '@t/bad', dependencies: { vue: '^3.0.0' } }),
    'pkgs/bad/src/App.vue': [
      '<script setup>',
      "import { Loader2 } from 'lucide-vue-next';",
      "import { helper } from '@t/dep';",
      "import 'side-effect-lib';",
      "export { reused } from 're-export-lib';",
      'const load = () => import(\'dynamic-lib\');',
      'const tpl = `',
      "  import { generated } from 'vue-tpl-not-a-dep';",
      '`;',
      '</script>',
    ].join('\n'),
    'pkgs/bad/src/keep.ts': "export const url = 'https://example.com/a';\nconst cjs = require('cjs-only-lib');\nexport default cjs;\n",
    // `#app`：由消费端（Nuxt）注入的构建别名，不经 node_modules，必须只报警告
    'pkgs/bad/src/use-directives.ts': "import { useNuxtApp } from '#app';\nexport const app = useNuxtApp;\n",
    // 三条"应报警告而非错误"的形态：配置文件的隐式提升（含 vite.config.<变体> 与包级 build 脚本）、测试文件、纯类型导入
    'pkgs/bad/vite.config.mts': "import { defineConfig } from 'cfg-only-lib';\nexport default defineConfig({});\n",
    'pkgs/bad/vite.config.trace.mts': "import { defineConfig } from 'trace-cfg-lib';\nexport default defineConfig({});\n",
    'pkgs/bad/build.mts': "import { transpileModule } from 'build-script-lib';\nexport default transpileModule;\n",
    'pkgs/bad/src/smoke.test.ts': "import { mount } from 'test-only-lib';\nexport const noop = mount;\n",
    // 故事文件：本仓无 Storybook，不进构建图，应与测试文件同级降级为警告
    'pkgs/bad/src/Button.stories.ts': "import { fn } from 'storybook-only-lib';\nexport default fn;\n",
    'pkgs/bad/src/story/Toggle.story.vue': "<script setup>\nimport { x } from 'story-dir-lib';\nconst y = x;\n</script>\n",
    'pkgs/bad/src/types.ts': "import type { T } from 'type-only-lib';\nexport type Local = T;\n",

    // ---- 规则 B（入口可达性）夹具 ----
    // 生产期入口指向 dist 且无 build 脚本：B0-10 的第二形态，必须报错
    'pkgs/entry-dead/package.json': JSON.stringify({
      name: '@t/entry-dead',
      main: './dist/index.mjs',
      module: './dist/index.mjs',
      exports: {
        '.': { types: './src/index.ts', development: './src/index.ts', default: './dist/index.mjs' },
      },
    }),
    'pkgs/entry-dead/src/index.ts': 'export const dead = 1;\n',
    // 有 build 脚本时 dist 只是"本地没跑"，CI 的 turbo build 会生产：不得报错
    'pkgs/entry-built/package.json': JSON.stringify({
      name: '@t/entry-built',
      scripts: { build: 'pnpm unbuild' },
      main: './dist/index.mjs',
      exports: { '.': { types: './src/index.ts', default: './dist/index.mjs' } },
    }),
    'pkgs/entry-built/src/index.ts': 'export const built = 1;\n',
    // 本仓"注释掉的键"约定（#build / //default）必须完全跳过，否则冤枉合法提交
    'pkgs/entry-parked/package.json': JSON.stringify({
      name: '@t/entry-parked',
      scripts: { '#build': 'pnpm unbuild' },
      files: ['src'],
      main: './src/index.ts',
      exports: {
        '.': { types: './src/index.ts', default: './src/index.ts', '//default': './dist/index.mjs' },
      },
    }),
    'pkgs/entry-parked/src/index.ts': 'export const parked = 1;\n',
    // 通配导出：目录前缀存在即合法（无法逐文件校验）
    'pkgs/entry-pattern-ok/package.json': JSON.stringify({
      name: '@t/entry-pattern-ok',
      exports: { './components/*': './src/components/*/index.ts' },
    }),
    'pkgs/entry-pattern-ok/src/components/Button/index.ts': 'export const button = 1;\n',
    // 通配导出的目录前缀不存在：任何子路径都解析不到，必须报错
    'pkgs/entry-pattern-dead/package.json': JSON.stringify({
      name: '@t/entry-pattern-dead',
      exports: { './ui/*': './src/ui/*/index.ts' },
    }),
    // 只有 types 条件缺失：影响 vue-tsc/dts，不进产物，应降级为警告
    'pkgs/entry-dev-missing/package.json': JSON.stringify({
      name: '@t/entry-dev-missing',
      exports: { '.': { types: './dist/index.d.ts', default: './src/index.ts' } },
    }),
    'pkgs/entry-dev-missing/src/index.ts': 'export const dev = 1;\n',
    // files 只含 dist 且无 build 脚本：发布轨会打空包，属存量债（警告）
    'pkgs/entry-empty-pack/package.json': JSON.stringify({
      name: '@t/entry-empty-pack',
      files: ['dist'],
      main: './src/index.ts',
    }),
    'pkgs/entry-empty-pack/src/index.ts': 'export const pack = 1;\n',
  };
  for (const [rel, content] of Object.entries(files)) {
    const abs = join(root, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content, 'utf8');
  }
}

/** 夹具必须命中的未声明依赖 / 不可达入口（每种形态各一条，缺任意一条说明该检查已空转） */
const REQUIRED_FIXTURE_VIOLATIONS = [
  ['具名 import（.vue）', '@t/bad', 'lucide-vue-next'],
  ['未声明的 workspace 包', '@t/bad', '@t/dep'],
  ['副作用 import', '@t/bad', 'side-effect-lib'],
  ['再导出 export…from', '@t/bad', 're-export-lib'],
  ['动态 import()', '@t/bad', 'dynamic-lib'],
  ['require()', '@t/bad', 'cjs-only-lib'],
  ['无 build 脚本却指向 dist 的生产期入口', '@t/entry-dead', './dist/index.mjs'],
  ['通配导出目录前缀不存在', '@t/entry-pattern-dead', './src/ui/*/index.ts'],
];

/** 夹具必须降级为警告的形态（若被当成错误，门禁会把不阻断构建的存量债变成红灯，逼人放宽规则） */
const REQUIRED_FIXTURE_WARNINGS = [
  ['配置文件隐式提升', '@t/bad', 'cfg-only-lib'],
  ['带变体名的配置文件（vite.config.trace.mts）', '@t/bad', 'trace-cfg-lib'],
  ['包级构建脚本（build.mts）', '@t/bad', 'build-script-lib'],
  ['测试文件', '@t/bad', 'test-only-lib'],
  ['故事文件（*.stories.ts）', '@t/bad', 'storybook-only-lib'],
  ['故事文件（story/ 目录下的 *.story.vue）', '@t/bad', 'story-dir-lib'],
  ['纯类型导入', '@t/bad', 'type-only-lib'],
  ['消费端构建别名 #app', '@t/bad', '#app'],
  ['仅 types 条件指向不存在的文件', '@t/entry-dev-missing', './dist/index.d.ts'],
  ['files 只含 dist 且无 build 脚本', '@t/entry-empty-pack', 'dist'],
];

function selfTest() {
  const dir = mkdtempSync(join(tmpdir(), 'ydsz-declared-deps-selftest-'));
  try {
    writeFixture(dir);
    const { violations, warnings, packages: pkgCount } = scan(dir);
    if (pkgCount !== FIXTURE_PACKAGE_COUNT) {
      console.error(
        `❌ 门禁自检失败：夹具应有 ${FIXTURE_PACKAGE_COUNT} 个包，实际 ${pkgCount} 个（workspace 解析失效）`,
      );
      process.exit(1);
    }
    const missed = REQUIRED_FIXTURE_VIOLATIONS.filter(
      ([, pkg, dep]) => !violations.some((v) => v.includes(pkg) && v.includes(`"${dep}"`)),
    );
    if (missed.length > 0) {
      console.error('❌ 门禁自检失败：反例未被下列检查命中，说明检查已空转：');
      for (const [name] of missed) console.error(`  - ${name}`);
      console.error(`  实际检出 ${violations.length} 条错误 / ${warnings.length} 条警告：`);
      for (const v of violations) console.error(`    · [错误] ${v}`);
      for (const w of warnings) console.error(`    · [警告] ${w}`);
      process.exit(1);
    }
    // 正向断言 1：good 包必须 0 违规 0 警告（否则 catalog/别名/内置模块/注释/查询串/
    // imports 声明过的 #别名 会被冤枉）
    const goodNoise = [...violations, ...warnings].filter((v) => v.includes('@t/good'));
    if (goodNoise.length > 0) {
      console.error('❌ 门禁自检失败：合法说明符被误报：');
      for (const v of goodNoise) console.error(`  - ${v}`);
      process.exit(1);
    }
    // 正向断言 2：模板字符串里的 import 属生成物源码，不得计入
    if (violations.some((v) => v.includes('vue-tpl-not-a-dep'))) {
      console.error('❌ 门禁自检失败：模板字符串内的 import 被计入（脚手架生成器会变成噪声源）');
      process.exit(1);
    }
    // 正向断言 3：违规必须恰好 6 项（bad 包 6 种形态各一条），多报即过滤逻辑不可靠
    if (violations.length !== REQUIRED_FIXTURE_VIOLATIONS.length) {
      console.error(
        `❌ 门禁自检失败：期望 ${REQUIRED_FIXTURE_VIOLATIONS.length} 条违规，实际 ${violations.length} 条：`,
      );
      for (const v of violations) console.error(`  - ${v}`);
      process.exit(1);
    }
    // 反向断言：三类"不阻断构建"的形态必须降级为警告，否则门禁会把存量债变红灯，
    // 结果就是所有人给它加白名单 —— 这正是本仓其它门禁空转的成因。
    const missedWarnings = REQUIRED_FIXTURE_WARNINGS.filter(
      ([, pkg, dep]) => !warnings.some((w) => w.includes(pkg) && w.includes(`"${dep}"`)),
    );
    if (missedWarnings.length > 0) {
      console.error('❌ 门禁自检失败：应降级为警告的形态未被正确分级：');
      for (const [name] of missedWarnings) console.error(`  - ${name}`);
      console.error(`  实际警告 ${warnings.length} 条：`);
      for (const w of warnings) console.error(`    · ${w}`);
      process.exit(1);
    }
    if (warnings.length !== REQUIRED_FIXTURE_WARNINGS.length) {
      console.error(
        `❌ 门禁自检失败：期望 ${REQUIRED_FIXTURE_WARNINGS.length} 条警告，实际 ${warnings.length} 条`,
      );
      process.exit(1);
    }
    // strict 模式必须把警告也计入失败（供后续把存量债清零后收紧）
    const strict = scan(dir, { strict: true });
    if (strict.violations.length !== violations.length + warnings.length) {
      console.error('❌ 门禁自检失败：--strict 未把警告计入失败（分级只是装饰，规则无法收紧）');
      process.exit(1);
    }
    console.log(
      `✅ 门禁自检通过：反例命中 ${REQUIRED_FIXTURE_VIOLATIONS.length}/${REQUIRED_FIXTURE_VIOLATIONS.length} 项错误 + ` +
        `${REQUIRED_FIXTURE_WARNINGS.length}/${REQUIRED_FIXTURE_WARNINGS.length} 项警告分级，` +
        '另含 4 条正向断言（合法说明符不误报 / 模板字符串不计入 / 无多余报告 / --strict 可收紧）',
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// ---------- 主流程 ----------
const argv = process.argv.slice(2);
const unknown = argv.filter((a) => !['--self-test', '--list-packages', '--strict'].includes(a));
if (unknown.length > 0) {
  console.error(`❌ 未知参数：${unknown.join(' ')}（支持 --self-test、--list-packages、--strict）`);
  process.exit(2);
}

if (argv.includes('--self-test')) {
  selfTest();
} else {
  let result;
  try {
    result = scan(ROOT_DIR, { strict: argv.includes('--strict') });
  } catch (error) {
    console.error(`❌ 依赖声明检查无法执行：${error.message}`);
    process.exit(1);
  }
  if (argv.includes('--list-packages')) {
    console.log(`workspace 包 ${result.packages} 个 / 源文件扫描：`);
    for (const line of result.packageNames) console.log(`  · ${line}`);
    process.exit(0);
  }
  if (result.packages === 0) {
    console.error('❌ 未扫描到任何 workspace 包（门禁会永远绿灯，拒绝通过）');
    process.exit(1);
  }
  if (result.violations.length > 0) {
    console.error(
      `❌ 存在未声明依赖（${result.packages} 个包，错误 ${result.violations.length} 项，` +
        `警告 ${result.warnings.length} 项${argv.includes('--strict') ? '，--strict' : ''}）：`,
    );
    for (const v of result.violations) console.error(`  - ${v}`);
    console.error('  说明：本门禁是"隔离 node_modules 下生产构建必红"的静态前置；修完后请实跑受影响包的 build。');
    process.exit(1);
  }
  if (result.warnings.length > 0) {
    console.warn(`⚠️  ${result.warnings.length} 项未声明依赖属配置/测试/纯类型导入（不阻断构建，计入存量债）：`);
    for (const w of result.warnings) console.warn(`  · ${w}`);
  }
  console.log(
    `✅ 依赖声明检查通过：${result.packages} 个 workspace 包的裸说明符全部有声明` +
      (result.warnings.length > 0 ? `（另有 ${result.warnings.length} 项警告，清零后可用 --strict 收紧）` : ''),
  );
}
