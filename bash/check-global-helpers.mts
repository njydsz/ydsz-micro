#!/usr/bin/env node
/**
 * 全局通知/确认助手门禁 —— 拦住「用了却没 import」这一类运行时崩溃。
 *
 * 背景（实测复现，不是推断）：
 *   2026-10 一次性审计（2916 个 .vue/.ts）发现 195 个文件、661 处调用
 *   `showToast.*()` / `YdConfirm()` 时**根本没有对应 import**：仓库既没有
 *   `unplugin-auto-import`，也没有 `globalThis.showToast` 注入，所以运行时必然抛
 *   `ReferenceError`。更糟的是这些调用点几乎都裹在 `try { … } catch { return }` 里，
 *   异常被吞掉后：成功提示不弹，**且紧跟其后的 `gridApi.query()` 列表刷新也不再执行**，
 *   表现为"删除成功但列表没变"，比直接白屏更难归因。
 *   典型：apps/system-web/src/views/feature-flag/index.vue 的删除流程。
 *
 * 判据（对每个源文件）：
 *   规则 A：出现在**表达式位置**的助手标识符（`X(` / `X.` / 裸引用），若本文件既没有
 *           import/re-export 它，也没有局部 function/const/class/解构声明它 → 报错，
 *           并给出正解导入行（见 HELPERS 表）。
 *   规则 B：`showToast({ … })` 这类把配置对象当首参的旧 Element Plus 形状。
 *           `@ydsz/notification` 的签名是 `showToast(title, options)`，对象首参会
 *           把 `[object Object]` 渲染进界面且类型不匹配 → 报错。
 *           注意：`showNotification(options)` 确实是对象首参，不在规则 B 内。
 *
 * 不误报的边界（自测逐条覆盖）：
 *   注释 / JSDoc @example / 模板里的字符串提及不算使用；
 *   `export { X } from` 与 `import { X } from` 是声明不是使用；
 *   `const { loading: showLoading } = props` 这类**重命名解构**声明了局部同名变量；
 *   `export const showNotification: NotificationApi = {` 带类型注解的声明同样是声明。
 *
 * 用法：
 *   node ./bash/check-global-helpers.mts              # 校验全仓
 *   node ./bash/check-global-helpers.mts --self-test  # 用夹具证明会拦、且不冤枉
 *
 * @path bash/check-global-helpers.mts
 * @author ydsz-team
 * @since 5.7.0
 */

import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** 不参与扫描的目录（产物、缓存、依赖、文档） */
const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  '.turbo',
  'coverage',
  'playwright-report',
  'test-results',
  '.git',
  'memory',
  'docs',
  '.qoder',
]);

/** 扫描根：只有这些顶层目录里的源文件受本门禁约束 */
const SCAN_ROOTS = ['apps', 'main', 'comm', 'packages', 'internal'];

/**
 * 助手标识符 → 正解导入来源。
 * 判定"没有全局注入"的依据：仓库内无 unplugin-auto-import，且这些名字从未挂到 globalThis。
 */
const HELPERS: Record<string, string> = {
  showToast: '@ydsz/notification',
  showNotification: '@ydsz/notification',
  YdConfirm: '@ydsz-core/popup-ui',
  YdAlert: '@ydsz-core/popup-ui',
};

/** 对象首参即错的助手（其余按各自签名，见文件头规则 B 说明） */
const POSITIONAL_ONLY = new Set(['showToast']);

/** 源文件判定：跳过声明文件与快照 */
function isSourceFile(name: string): boolean {
  if (name.endsWith('.d.ts')) return false;
  return /\.(?:vue|ts|tsx)$/.test(name);
}

/** 递归收集待扫文件 */
function collectFiles(dir: string, out: string[]): string[] {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      collectFiles(full, out);
      continue;
    }
    if (isSourceFile(name)) out.push(full);
  }
  return out;
}

/**
 * 把注释与字符串**内容**替换成等长空白：行列号不变，其中的助手名不再被当成使用。
 *
 * 字符串只掏空内容、保留引号：引号是 `import { X } from '…'` 的锚点，
 * 连引号一起抹掉会让声明识别正则全部失配，把已正确导入的文件误判成违规。
 */
function blankNonCode(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (s) => s.replace(/[^\n]/g, ' '))
    .replace(/<!--[\s\S]*?-->/g, (s) => s.replace(/[^\n]/g, ' '))
    .replace(/(^|\n)[ \t]*\/\/[^\n]*/g, (s) => s.replace(/[^\n]/g, ' '))
    .replace(/(['"`])(?:\\.|[^\\])*?\1/g, (s) => s.slice(0, 1) + s.slice(1, -1).replace(/[^\n]/g, ' ') + (s.length > 1 ? s.slice(-1) : ''));
}

/** 行号（1 起） */
function lineAt(text: string, index: number): number {
  return text.slice(0, index).split('\n').length;
}

/**
 * 收集 import / re-export 引入的名字与它们占据的字符区间。
 *
 * 只认 `import [type] {…} from '..'`、`import Default from '..'`、`import * as ns from '..'`
 * 与 `export [type] {…} from '..'` 四种形态。刻意不用 `(?:import|export)\b[^;]*?['"]`
 * 这类"跨行找引号"的写法：它会吞掉 `export function f() { … }` 之后真正的 import 语句，
 * 把已修复的文件重新误判成违规（本轮自测抓到过这条）。
 */
function readDeclarations(code: string): { names: Set<string>; ranges: Array<[number, number]> } {
  const names = new Set<string>();
  const ranges: Array<[number, number]> = [];
  const braces = /(?:^|\n)[ \t]*(?:import|export(?:[ \t]+type)?)[ \t]*\{([\s\S]*?)\}[ \t]*(?:from[ \t]*)?['"][^'"]*['"][ \t]*;?/g;
  const single = /(?:^|\n)[ \t]*import[ \t]+([A-Za-z_$][\w$]*)([ \t]*(?:,[ \t]*\{[\s\S]*?\})?)[ \t]*from[ \t]*['"][^'"]*['"][ \t]*;?/g;
  const star = /(?:^|\n)[ \t]*import[ \t]*\*[ \t]*as[ \t]*([A-Za-z_$][\w$]*)[ \t]*from[ \t]*['"][^'"]*['"][ \t]*;?/g;
  let m: RegExpExecArray | null;
  while ((m = braces.exec(code))) {
    ranges.push([m.index, m.index + m[0].length]);
    for (const part of m[1].split(',')) {
      const token = part.trim();
      if (!token) continue;
      const seg = token.split(/\s+as\s+/);
      names.add((seg[1] ?? seg[0]).trim().replace(/^type[ \t]+/, ''));
    }
  }
  while ((m = single.exec(code))) {
    ranges.push([m.index, m.index + m[0].length]);
    names.add(m[1]);
  }
  while ((m = star.exec(code))) {
    ranges.push([m.index, m.index + m[0].length]);
    names.add(m[1]);
  }
  return { names, ranges };
}

/**
 * 收集本文件局部声明掉的助手名（同名局部变量优先于全局查找）。
 * 覆盖 function/class、带类型注解的 const/let/var、以及 `{ a, loading: showLoading }` 解构。
 */
function readLocalDeclarations(code: string): Set<string> {
  const locals = new Set<string>();
  const reFn = /(?:function|class)[ \t]+([A-Za-z_$][\w$]*)/g;
  const reVar = /(?:const|let|var)[ \t]+([A-Za-z_$][\w$]*)[ \t]*(?::[^=\n]*?)?=/g;
  const reDestruct = /(?:const|let|var)[ \t]*\{([\s\S]*?)\}[ \t]*(?::[^=]*?)?=/g;
  let m: RegExpExecArray | null;
  while ((m = reFn.exec(code))) locals.add(m[1]);
  while ((m = reVar.exec(code))) locals.add(m[1]);
  while ((m = reDestruct.exec(code))) {
    for (const part of m[1].split(',')) {
      const token = part.trim();
      if (!token) continue;
      const seg = token.split(/\s*:\s*/);
      locals.add((seg[1] ?? seg[0]).trim().replace(/[ \t]*=.*$/, ''));
    }
  }
  return locals;
}

/** 一条违规 */
interface Violation {
  file: string;
  line: number;
  helper: string;
  kind: 'missing-import' | 'wrong-arg-shape';
}

/**
 * 表达式位置的助手引用：前面不是单词字符或 `.`（排除 `foo.showToast` 成员访问），
 * 后面不是单词字符。
 */
function usagePattern(helper: string): RegExp {
  return new RegExp('(?<![\\w$.])' + helper + '(?![\\w$])', 'g');
}

/**
 * 属性键位置判定：`{ showToast: vi.fn() }` 里的 `showToast` 是**对象键**，
 * 不是对全局变量的引用，不能算违规。
 *
 * @param code - 掏空注释/字符串后的源码
 * @param endIndex - 标识符结束偏移
 */
function isPropertyKey(code: string, endIndex: number): boolean {
  const match = /^[ \t\r]*(?::(?!:))/.exec(code.slice(endIndex));
  return match !== null;
}

/** 判断某偏移是否落在声明区间内 */
function inRanges(ranges: Array<[number, number]>, index: number): boolean {
  return ranges.some(([start, end]) => index >= start && index < end);
}

/**
 * 扫描单文件，返回违规列表。
 *
 * @param absPath - 源文件绝对路径
 * @param rootDir - 用于把路径裁成仓库相对形式
 */
function scanFile(absPath: string, rootDir: string): Violation[] {
  const rel = relative(rootDir, absPath).replace(/\\/g, '/');
  if (rel.includes('/__snapshots__/')) return [];
  const src = readFileSync(absPath, 'utf8');
  const code = blankNonCode(src);
  const { names: imported, ranges } = readDeclarations(code);
  const locals = readLocalDeclarations(code);
  const found: Violation[] = [];

  for (const helper of Object.keys(HELPERS)) {
    if (imported.has(helper) || locals.has(helper)) continue;
    const re = usagePattern(helper);
    let m: RegExpExecArray | null;
    while ((m = re.exec(code))) {
      if (inRanges(ranges, m.index)) continue;
      if (isPropertyKey(code, m.index + helper.length)) continue;
      found.push({ file: rel, line: lineAt(code, m.index), helper, kind: 'missing-import' });
      break;
    }
  }

  for (const helper of POSITIONAL_ONLY) {
    const re = new RegExp('(?<![\\w$])' + helper + '[ \\t]*\\([ \\t]*\\{', 'g');
    const m = re.exec(code);
    if (m && !inRanges(ranges, m.index)) {
      found.push({ file: rel, line: lineAt(code, m.index), helper, kind: 'wrong-arg-shape' });
    }
  }
  return found;
}

/** 扫描结果 */
interface ScanResult {
  files: number;
  violations: Violation[];
}

/** 递归扫描一个根目录 */
function scanRoot(rootDir: string, sub: string): ScanResult {
  const files = collectFiles(join(rootDir, sub), []);
  const violations: Violation[] = [];
  for (const file of files) violations.push(...scanFile(file, rootDir));
  return { files: files.length, violations };
}

/** 全仓扫描 */
function scanAll(rootDir: string): ScanResult {
  let files = 0;
  const violations: Violation[] = [];
  for (const sub of SCAN_ROOTS) {
    const result = scanRoot(rootDir, sub);
    files += result.files;
    violations.push(...result.violations);
  }
  return { files, violations };
}

/** 生成人话修复建议 */
function describe(v: Violation): string {
  if (v.kind === 'wrong-arg-shape') {
    return `${v.file}:${v.line} ${v.helper}({ … }) 传的是对象，但签名是 ${v.helper}(title, options)：`
      + `改成 ${v.helper}('文案', { duration })，否则界面会渲染出 [object Object]`;
  }
  return `${v.file}:${v.line} 用了 ${v.helper} 却没有导入（运行时 ReferenceError；被 try/catch 吞掉后`
    + `其后的列表刷新也会一起失效）。修法：加 ${`import { ${v.helper} } from '${HELPERS[v.helper]}';`}`;
}

/** 自测：夹具必须被拦住，且合法写法一律不冤枉 */
function selfTest(): void {
  const dir = mkdtempSync(join(tmpdir(), 'ydsz-global-helpers-selftest-'));
  const cases: Array<{ name: string; text: string; expect: string | null }> = [
    {
      name: 'missing.ts',
      text: "export function del(){\n  YdConfirm('删？', '标题');\n}\n",
      expect: 'YdConfirm',
    },
    {
      name: 'missing.vue',
      text: "<template><p>x</p></template>\n<script lang=\"ts\" setup>\nconst go = () => showToast.success('好');\n</script>\n",
      expect: 'showToast',
    },
    {
      name: 'ok-imported.ts',
      text: "import { showToast, YdConfirm } from '@ydsz/notification';\nvoid showToast; void YdConfirm;\n",
      expect: null,
    },
    {
      name: 'ok-multiline-import.vue',
      text: "<script lang=\"ts\" setup>\nimport {\n  ref,\n} from 'vue';\nimport {\n  YdConfirm,\n} from '@ydsz-core/popup-ui';\nvoid YdConfirm; void ref;\n</script>\n",
      expect: null,
    },
    {
      name: 'ok-export-after-function.ts',
      text: "export function isFoo(v: unknown): v is Foo {\n  return typeof v === 'object' && v !== null;\n}\n\nimport { showToast } from '@ydsz/notification';\nvoid showToast;\n",
      expect: null,
    },
    {
      name: 'ok-comment-only.ts',
      text: "/** @example showToast('hi') */\n// YdConfirm('x')\nexport const a = 1;\n",
      expect: null,
    },
    {
      name: 'ok-string-only.vue',
      text: "<script lang=\"ts\" setup>\nconst tip = 'showToast 已废弃';\nvoid tip;\n</script>\n",
      expect: null,
    },
    {
      name: 'ok-renamed-destructure.vue',
      text: "<script lang=\"ts\" setup>\nconst props = defineProps<{ loading?: boolean }>();\nconst { loading: showLoading } = props;\nvoid showLoading;\n</script>\n",
      expect: null,
    },
    {
      name: 'ok-local-const.vue',
      text: "<script lang=\"ts\" setup>\nconst showNotification: { info: (o: unknown) => void } = { info: () => {} };\nshowNotification.info({});\n</script>\n",
      expect: null,
    },
    {
      // 真实回归用例：apps/system-web/src/views/config/index.test.ts 里
      // `showToast: { success: vi.fn() }` 是对象键，不是全局引用
      name: 'ok-mock-object-key.ts',
      text: "export const mocks = {\n  YdConfirm: vi.fn().mockResolvedValue({}),\n  showToast: { success: vi.fn(), error: vi.fn() },\n};\n",
      expect: null,
    },
    {
      name: 'ok-member-access.ts',
      text: "obj.showToast('x');\nns.YdConfirm('y');\n",
      expect: null,
    },
    {
      name: 'wrong-shape.ts',
      text: "import { showToast } from '@ydsz/notification';\nshowToast({\n  duration: 1500,\n  message: '加载中',\n});\n",
      expect: 'showToast',
    },
  ];

  const failures: string[] = [];
  for (const c of cases) {
    const abs = join(dir, 'apps', 'fixture-web', 'src', c.name);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, c.text);
    const hits = scanFile(abs, dir);
    if (c.expect === null) {
      if (hits.length > 0) failures.push(`冤枉：${c.name} 本应通过，实际报 ${hits.map((h) => h.helper).join(',')}`);
    } else if (!hits.some((h) => h.helper === c.expect)) {
      failures.push(`漏拦：${c.name} 本应报 ${c.expect}，实际 ${hits.map((h) => h.helper).join(',') || '无'}`);
    }
  }
  rmSync(dir, { force: true, recursive: true });

  if (failures.length > 0) {
    console.error(`❌ check-global-helpers 自测失败（${failures.length} 项）：`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log(`✅ check-global-helpers 自测通过：${cases.length} 个夹具，拦得住且不冤枉`);
}

/** 入口 */
function main(): void {
  const argv = process.argv.slice(2);
  if (argv.includes('--self-test')) {
    selfTest();
    return;
  }
  const result = scanAll(ROOT_DIR);
  if (result.files === 0) {
    console.error('❌ 未扫描到任何源文件（门禁会永远绿灯，拒绝通过）');
    process.exit(1);
  }
  if (result.violations.length > 0) {
    console.error(`❌ 存在未导入的全局助手调用（扫描 ${result.files} 个文件，违规 ${result.violations.length} 项）：`);
    for (const v of result.violations) console.error(`  - ${describe(v)}`);
    console.error('  说明：本仓无 unplugin-auto-import，也没有 globalThis 注入；这类调用运行时必抛 ReferenceError。');
    process.exit(1);
  }
  console.log(`✅ 全局助手导入检查通过：${result.files} 个源文件，无"用了却没 import"`);
}

main();
