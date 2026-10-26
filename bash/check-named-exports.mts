#!/usr/bin/env node
/**
 * 本地具名导入一致性门禁 —— 拦住「导入了模块里根本不存在的名字」。
 *
 * 背景（实测复现，不是推断）：
 *   2026-10 全量 `pnpm build` 里 Rollup 报出
 *   `apps/nextwiki-web/src/views/favorites/index.vue (17:58): "updateSortOrder" is not
 *   exported by "src/api/userFavorite.ts"` —— **只是 WARN，构建照样 exit 0**。
 *   运行时该标识符是 undefined，点「保存排序」直接 TypeError，列表既不刷新也没提示。
 *   同文件里调用写的是第三个名字 `updateSort`，既没导入也没导出，同一条链上两处漂移。
 *
 *   这类漂移的高发原因很具体：`src/api/*.ts` 由 `bash/gen-contract.py` 从后端契约生成，
 *   后端改方法名 → 重新生成 → 前端视图里的导入名不会跟着改；`@ydsz/vite-config` 的
 *   tree-shaking 也不会替我们校验标识符绑定。
 *
 * 判据（只针对**本地**说明符，即相对路径与 `#/`、`@/` 应用内别名）：
 *   1. 解析出被导入模块的真实导出集合（含 `export {}` / `export {} from` / `export *` 递归展开）。
 *   2. 导入名不在集合里 → 违规。
 *   3. 集合无法确定（目标解析不到、目标是 .vue、`export *` 指向三方包）→ 判为不可判，
 *      明确跳过而不是猜成违规：门禁冤枉一次，之后所有人都会习惯性加白名单。
 *   跨包说明符（`@ydsz/…`）不在本门禁范围：其导出面由构建期产物与 P1-3 的 d.ts 校验负责。
 *
 * 用法：
 *   node ./bash/check-named-exports.mts              # 校验全仓
 *   node ./bash/check-named-exports.mts --self-test  # 用夹具证明会拦、且不冤枉
 *
 * @path bash/check-named-exports.mts
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
  // 契约快照归档区：4 个应用下共 21 个 .ts，全仓无任何引用、不进模块图。
  // 它们是后端旧版接口的留档，不是可执行代码，纳入门禁只会制造噪音。
  'archived',
]);

/** 扫描根：只有这些顶层目录里的源文件受本门禁约束 */
const SCAN_ROOTS = ['apps', 'main', 'comm', 'packages', 'internal'];

/** 可导入的源文件后缀（解析时按此顺序试探） */
const EXTENSIONS = ['', '.ts', '.mts', '.cts', '.tsx', '.vue', '.js', '.mjs'];

/** 目录形态的说明符要补的入口文件名 */
const INDEX_NAMES = ['index.ts', 'index.mts', 'index.tsx', 'index.vue', 'index.js', 'index.mjs'];

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
 * 把注释替换成等长空白（行列号不变），**字符串保留原样**。
 *
 * 与 check-global-helpers 相反：这里的锚点正是 `from '…'` 里的说明符本身，
 * 掏空字符串会让所有导入语句失配，门禁变成永远绿灯的摆设。
 */
function blankComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (s) => s.replace(/[^\n]/g, ' '))
    .replace(/<!--[\s\S]*?-->/g, (s) => s.replace(/[^\n]/g, ' '))
    .replace(/(^|\n)[ \t]*\/\/[^\n]*/g, (s) => s.replace(/[^\n]/g, ' '));
}

/**
 * SFC 只保留各 `<script>` 块内容，其余字符换成等长空白。
 *
 * 必须等长：违规要报出**原文件**的行号，长度一乱行号就全错。
 * template/style 里不可能出现 import，直接挖掉可避免把模板文本当成代码。
 */
function scriptRegions(code: string): string {
  const re = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  if (!re.test(code)) return code;
  re.lastIndex = 0;
  let out = code.replace(/[^\n]/g, ' ');
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) {
    const content = m[1];
    const start = m.index + m[0].indexOf('>') + 1;
    out = out.slice(0, start) + content + out.slice(start + content.length);
  }
  return out;
}

/** 一条具名导入：本地名 + 源名 + 行号 + 说明符 */
interface NamedImport {
  imported: string;
  local: string;
  line: number;
  specifier: string;
}

/**
 * `import [type] { … } from '…'`
 *
 * 两条硬约束，缺一个就会批量假阳性：
 *   1. 花括号里不允许出现 `;`——否则跨行匹配会一路吞到**下一条** import 的 `}`，
 *      把两条语句的名字串成一个（`Record<string` / `never>` 这类碎片就是这么来的）。
 *   2. `}` 与 `from` 之间允许换行——`import { a, b }\n  from '#/api/x'` 是本仓生成件的常见排版。
 */
function readNamedImports(code: string): NamedImport[] {
  const out: NamedImport[] = [];
  const re = /(?:^|\n)[ \t]*import(?:[ \t]+type)?[ \t]*\{([^;]*?)\}[ \t]*(?:\r?\n[ \t]*)?from[ \t]*['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) {
    const specifier = m[2];
    if (!isLocalSpecifier(specifier)) continue;
    const line = code.slice(0, m.index).split('\n').length;
    for (const part of m[1].split(',')) {
      const token = part.trim().replace(/^type[ \t]+/, '');
      if (!token) continue;
      const seg = token.split(/\s+as\s+/);
      const imported = (seg[0] ?? '').trim();
      if (!imported || imported === 'default') continue;
      // 只认合法标识符：正则跨行串味时的碎片（`Record<string`）不该当成导入名报出去
      if (!/^[A-Za-z_$][\w$]*$/.test(imported)) continue;
      out.push({ imported, local: (seg[1] ?? seg[0]).trim(), line, specifier });
    }
  }
  return out;
}

/** 只认本地说明符；包名/URL 一律不判 */
function isLocalSpecifier(spec: string): boolean {
  return spec.startsWith('./') || spec.startsWith('../') || spec.startsWith('#/') || spec.startsWith('@/');
}

/** 说明符 → 绝对文件路径；解析不到返回 null（交由调用方判为不可判） */
function resolveSpecifier(spec: string, importer: string, pkgRoot: string): string | null {
  let base: string;
  if (spec.startsWith('#/') || spec.startsWith('@/')) {
    base = join(pkgRoot, 'src', spec.slice(2));
  } else {
    base = resolve(dirname(importer), spec);
  }
  const asFile = EXTENSIONS.map((ext) => base + ext).find((p) => existsSync(p) && statSync(p).isFile());
  if (asFile) return asFile;
  const asIndex = INDEX_NAMES.map((n) => join(base, n)).find((p) => existsSync(p) && statSync(p).isFile());
  return asIndex ?? null;
}

/** 离得最近的 package.json 所在目录即包根（`#/` 别名的锚点） */
function findPkgRoot(fromFile: string, stopAt: string): string | null {
  let dir = dirname(fromFile);
  while (dir.startsWith(stopAt) && dir !== stopAt) {
    if (existsSync(join(dir, 'package.json'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return existsSync(join(stopAt, 'package.json')) ? stopAt : null;
}

/** 导出面判定结果：`names` 为确定集合，`opaque` 表示存在无法展开的导出来源 */
interface ExportFace {
  names: Set<string>;
  opaque: boolean;
}

/**
 * 读取一个模块对外暴露的具名名字。
 *
 * 递归展开 `export * from './x'` 与 `export { a } from './x'`；
 * 一旦 `export *` 指向本地解析不到的模块（三方包、别名歧义）就整体标记 opaque，
 * 因为此时"没找到"不等于"不存在"，宁可放过。
 */
function readExportFace(file: string, pkgRoot: string, seen: Set<string>): ExportFace {
  const names = new Set<string>();
  if (seen.has(file)) return { names, opaque: true };
  seen.add(file);
  if (file.endsWith('.vue')) return { names, opaque: true };

  const code = blankComments(readFileSync(file, 'utf8'));
  const localNames = new Set(readLocalBindingNames(code));
  let opaque = false;

  const decl = /(?:^|\n)[ \t]*export(?:[ \t]+declare)?[ \t]*(?:async[ \t]+)?(function|class|const|let|var)[ \t]+([A-Za-z_$][\w$]*)/g;
  const declDestruct = /(?:^|\n)[ \t]*export[ \t]*(?:const|let|var)[ \t]*\{([\s\S]*?)\}/g;
  // `export const [injectFormProps, provideFormProps] = createInjectionState()`
  const declArray = /(?:^|\n)[ \t]*export[ \t]*(?:const|let|var)[ \t]*\[([^\]]*)\]/g;
  const typeDecl = /(?:^|\n)[ \t]*export[ \t]+(type|interface|enum)[ \t]+([A-Za-z_$][\w$]*)/g;
  const star = /(?:^|\n)[ \t]*export(?:[ \t]+type)?[ \t]*\*[ \t]*(?:as[ \t]+([A-Za-z_$][\w$]*)[ \t]*)?from[ \t]*['"]([^'"]+)['"]/g;
  const braces = /(?:^|\n)[ \t]*export(?:[ \t]+type)?[ \t]*\{([^;]*?)\}(?:[ \t]*(?:\r?\n[ \t]*)?from[ \t]*['"]([^'"]+)['"])?/g;

  let m: RegExpExecArray | null;
  while ((m = decl.exec(code))) names.add(m[2]);
  while ((m = typeDecl.exec(code))) names.add(m[2]);
  while ((m = declDestruct.exec(code))) {
    for (const part of m[1].split(',')) {
      const token = part.trim().split(/\s*:\s*/).pop() ?? '';
      const name = token.split(/[ \t=]/)[0];
      if (name && /^[A-Za-z_$][\w$]*$/.test(name)) names.add(name);
    }
  }
  while ((m = declArray.exec(code))) {
    for (const part of m[1].split(',')) {
      const name = part.trim().split(/[ \t=:\]]/)[0];
      if (name && /^[A-Za-z_$][\w$]*$/.test(name)) names.add(name);
    }
  }
  while ((m = star.exec(code))) {
    if (m[1]) {
      names.add(m[1]);
      continue;
    }
    if (!isLocalSpecifier(m[2])) {
      opaque = true;
      continue;
    }
    const target = resolveSpecifier(m[2], file, pkgRoot);
    if (!target) {
      opaque = true;
      continue;
    }
    const sub = readExportFace(target, pkgRoot, seen);
    sub.names.forEach((n) => names.add(n));
    opaque = opaque || sub.opaque;
  }
  while ((m = braces.exec(code))) {
    const from = m[2];
    for (const part of m[1].split(',')) {
      const token = part.trim().replace(/^type[ \t]+/, '');
      if (!token) continue;
      const seg = token.split(/\s+as\s+/);
      const exported = (seg[1] ?? seg[0]).trim();
      if (!exported || exported === 'default') continue;
      if (from && !isLocalSpecifier(from)) {
        // `export { requestClient } from '@ydsz/shared-auth'`：本文件已明确点名该导出，
        // 上游包若真的没提供，报错形态是"包侧缺导出"而非"本地写错名字"，
        // 这里按文件自述收下它，否则每个 re-export 文件都会成为假阳性源头。
        names.add(exported);
        continue;
      }
      if (from) {
        const target = resolveSpecifier(from, file, pkgRoot);
        if (!target) {
          opaque = true;
          continue;
        }
        const sub = readExportFace(target, pkgRoot, seen);
        if (sub.opaque || !sub.names.has(seg[0].trim())) {
          opaque = true;
        } else {
          names.add(exported);
        }
        continue;
      }
      // 纯 `export { a }`：只有 a 在本文件确有同名绑定才算导出
      if (localNames.has(seg[0].trim())) names.add(exported);
    }
  }
  return { names, opaque };
}

/**
 * 文件内**所有**局部绑定名，用于校验裸 `export { a }` 与 `export const [x, y] =`。
 *
 * 必须覆盖这几种，否则会批量冤枉正常代码（都是本轮实测踩到的）：
 *   - 先声明、文件末尾统一 `export type { … }`：comm/effects/request/src/request-client/types.ts
 *   - `export { $t, setupI18n }` 导出的是**上面 import 进来的**名字：main/src/locales/index.ts
 *   - `export const [injectFormProps, provideFormProps] = createInjectionState()`：
 *     comm/@core/ui-kit/form-ui/src/use-form-context.ts
 */
function readLocalBindingNames(code: string): Set<string> {
  const out = new Set<string>();
  const add = (name: string) => {
    const clean = name.trim().replace(/^type[ \t]+/, '').split(/[ \t=,;:[\]]/)[0];
    if (/^[A-Za-z_$][\w$]*$/.test(clean)) out.add(clean);
  };

  const decl = /(?:^|\n)[ \t]*(?:export[ \t]+)?(?:declare[ \t]+)?(?:(?:async[ \t]+)?(function|class|const|let|var)|(?:type|interface|enum))[ \t]+([A-Za-z_$][\w$]*)/g;
  const objPattern = /(?:^|\n)[ \t]*(?:export[ \t]+)?(?:const|let|var)[ \t]*\{([^}]*)\}/g;
  const arrPattern = /(?:^|\n)[ \t]*(?:export[ \t]+)?(?:const|let|var)[ \t]*\[([^\]]*)\]/g;
  const imported = /(?:^|\n)[ \t]*import(?:[ \t]+type)?[ \t]*(?:\{([^}]*)\}|([A-Za-z_$][\w$]*)|[ \t]*\*[ \t]*as[ \t]*([A-Za-z_$][\w$]*))/g;

  let m: RegExpExecArray | null;
  while ((m = decl.exec(code))) add(m[2]);
  while ((m = objPattern.exec(code))) m[1].split(',').forEach((p) => add((p.split(/\s*:\s*/)[1] ?? p.split(/\s+as\s+/)[1] ?? p)));
  while ((m = arrPattern.exec(code))) m[1].split(',').forEach((p) => add(p.split(/[ \t=]/)[0]));
  while ((m = imported.exec(code))) {
    if (m[1]) m[1].split(',').forEach((p) => add((p.split(/\s+as\s+/)[1] ?? p)));
    if (m[2]) add(m[2]);
    if (m[3]) add(m[3]);
  }
  return out;
}

/** 一条违规 */
interface Violation {
  exportedAvailable: string[];
  file: string;
  imported: string;
  line: number;
  specifier: string;
}

/** 扫描单文件 */
function scanFile(absPath: string, rootDir: string, cache: Map<string, ExportFace | null>): Violation[] {
  const rel = relative(rootDir, absPath).replace(/\\/g, '/');
  if (rel.includes('/__snapshots__/')) return [];
  const pkgRoot = findPkgRoot(absPath, rootDir);
  if (!pkgRoot) return [];

  let code = blankComments(readFileSync(absPath, 'utf8'));
  if (absPath.endsWith('.vue')) code = scriptRegions(code);
  const imports = readNamedImports(code);
  if (imports.length === 0) return [];

  const found: Violation[] = [];
  for (const imp of imports) {
    const target = resolveSpecifier(imp.specifier, absPath, pkgRoot);
    if (!target) continue;
    let face = cache.get(target);
    if (face === undefined) {
      face = readExportFace(target, pkgRoot, new Set());
      cache.set(target, face);
    }
    if (!face) continue;
    if (face.opaque && !face.names.has(imp.imported)) continue;
    if (face.names.has(imp.imported)) continue;
    found.push({
      exportedAvailable: [...face.names].sort().slice(0, 12),
      file: rel,
      imported: imp.imported,
      line: imp.line,
      specifier: imp.specifier,
    });
  }
  return found;
}

/** 全仓扫描结果 */
interface ScanResult {
  files: number;
  violations: Violation[];
}

/** 扫描所有根目录 */
function scanAll(rootDir: string): ScanResult {
  const cache = new Map<string, ExportFace | null>();
  const violations: Violation[] = [];
  let files = 0;
  for (const sub of SCAN_ROOTS) {
    for (const file of collectFiles(join(rootDir, sub), [])) {
      files += 1;
      violations.push(...scanFile(file, rootDir, cache));
    }
  }
  return { files, violations };
}

/** 人话修复建议 */
function describe(v: Violation): string {
  return `${v.file}:${v.line} 从 '${v.specifier}' 导入了 '${v.imported}'，但该模块并没有这个名字`
    + `（Rollup 只报 WARN、构建仍绿；运行时是 undefined 调用 → TypeError）。`
    + `该模块现有导出：${v.exportedAvailable.join(', ') || '（无具名导出）'}`;
}

/** 自测：夹具必须被拦住，且合法写法一律不冤枉 */
function selfTest(): void {
  const dir = mkdtempSync(join(tmpdir(), 'ydsz-named-exports-selftest-'));
  const write = (rel: string, text: string) => {
    const abs = join(dir, 'apps', 'fixture-web', rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, text);
  };
  write('package.json', '{ "name": "@t/fixture-web" }');
  write('src/api/userFavorite.ts', "export function updatesort(n: string, p: { sort?: number }) { return p }\nexport const FAVORITE_MAX = 10;\n");
  write('src/api/models.ts', "export type UserFavoriteVO = { nodeId: string };\nexport interface Foo { a: 1 }\n");
  write('src/api/barrel.ts', "export * from './userFavorite';\nexport { FAVORITE_MAX as MAX_FAV } from './userFavorite';\n");
  write('src/api/bad.ts', "const inner = 1;\nexport { inner };\n");
  // 真实形态回归：types.ts 先声明、文件末尾统一 `export type { … }`
  write('src/api/deferred-types.ts', "interface RequestClientConfig { url: string }\ntype HttpResponse = { data: unknown }\n\nexport type {\n  HttpResponse,\n  RequestClientConfig,\n};\n");
  write('src/api/third.ts', "export * from 'some-external-pkg';\n");
  write('src/views/bad-import.vue', "<template><p>x</p></template>\n<script lang=\"ts\" setup>\nimport { updateSortOrder } from '#/api/userFavorite';\nvoid updateSortOrder;\n</script>\n");
  write('src/views/ok-alias.ts', "import { updatesort as updateSort } from '#/api/userFavorite';\nvoid updateSort;\n");
  write('src/views/ok-type.ts', "import type { UserFavoriteVO, Foo } from '#/api/models';\nvoid 0 as unknown as UserFavoriteVO | Foo;\n");
  write('src/views/ok-barrel.ts', "import { updatesort, MAX_FAV } from '#/api/barrel';\nvoid updatesort; void MAX_FAV;\n");
  write('src/views/ok-local-export.ts', "import { inner } from '#/api/bad';\nvoid inner;\n");
  write('src/views/ok-opaque.ts', "import { whateverName } from '#/api/third';\nvoid whateverName;\n");
  write('src/views/ok-comment.vue', "<template><p>x</p></template>\n<script lang=\"ts\" setup>\n/** @example import { nope } from '#/api/userFavorite' */\n// import { alsoNope } from '#/api/userFavorite'\nvoid 1;\n</script>\n");
  write('src/views/ok-relative.ts', "import { FAVORITE_MAX } from '../api/userFavorite';\nvoid FAVORITE_MAX;\n");
  write('src/views/ok-deferred-type.ts', "import type { RequestClientConfig, HttpResponse } from '#/api/deferred-types';\nvoid 0 as unknown as RequestClientConfig | HttpResponse;\n");
  write('src/views/bad-deferred-type.ts', "import type { NeverDeclared } from '#/api/deferred-types';\nvoid 0 as unknown as NeverDeclared;\n");
  write('src/views/bad-relative.ts', "import { nopeHere } from '../api/userFavorite';\nvoid nopeHere;\n");

  // 真实形态回归：apps/*/src/api/request.ts 全部是对上游包的 re-export 清单
  write('src/api/request.ts', "export {\n  baseRequestClient,\n  initSharedRequest,\n  requestClient,\n} from '@ydsz/shared-auth';\n");
  // 真实形态回归：main/src/locales/index.ts 先 import、末尾 `export { $t, setupI18n }`
  write('src/api/locale-barrel.ts', "import { $t, setupI18n } from '@ydsz/locales';\n\nexport { $t, setupI18n };\n");
  // 真实形态回归：form-ui 的 createInjectionState 数组解构导出
  write('src/api/injection.ts', "export const [injectFormProps, provideFormProps] = createInjectionState();\nexport function useFormInitial() { return null }\n");
  write('src/views/ok-reexport-imported.ts', "import { $t } from '#/api/locale-barrel';\nvoid $t;\n");
  write('src/views/ok-array-destructure.ts', "import { injectFormProps, useFormInitial } from '#/api/injection';\nvoid injectFormProps; void useFormInitial;\n");
  write('src/views/bad-array-destructure.ts', "import { injectNever } from '#/api/injection';\nvoid injectNever;\n");
  write('src/views/ok-reexport-package.ts', "import { requestClient } from '#/api/request';\nvoid requestClient;\n");
  write('src/views/bad-reexport-package.ts', "import { notInThatList } from '#/api/request';\nvoid notInThatList;\n");

  const cases: Array<{ file: string; mustContain: string | null }> = [
    { file: 'src/views/bad-import.vue', mustContain: 'updateSortOrder' },
    { file: 'src/views/bad-relative.ts', mustContain: 'nopeHere' },
    { file: 'src/views/bad-deferred-type.ts', mustContain: 'NeverDeclared' },
    { file: 'src/views/bad-reexport-package.ts', mustContain: 'notInThatList' },
    { file: 'src/views/ok-reexport-package.ts', mustContain: null },
    { file: 'src/views/ok-reexport-imported.ts', mustContain: null },
    { file: 'src/views/ok-array-destructure.ts', mustContain: null },
    { file: 'src/views/bad-array-destructure.ts', mustContain: 'injectNever' },
    { file: 'src/views/ok-deferred-type.ts', mustContain: null },
    { file: 'src/views/ok-alias.ts', mustContain: null },
    { file: 'src/views/ok-type.ts', mustContain: null },
    { file: 'src/views/ok-barrel.ts', mustContain: null },
    { file: 'src/views/ok-local-export.ts', mustContain: null },
    { file: 'src/views/ok-opaque.ts', mustContain: null },
    { file: 'src/views/ok-comment.vue', mustContain: null },
    { file: 'src/views/ok-relative.ts', mustContain: null },
  ];

  const failures: string[] = [];
  for (const c of cases) {
    const hits = scanFile(join(dir, 'apps', 'fixture-web', c.file), dir, new Map());
    if (c.mustContain === null) {
      if (hits.length > 0) failures.push(`冤枉：${c.file} 本应通过，实际报 ${hits.map((h) => h.imported).join(',')}`);
    } else if (!hits.some((h) => h.imported === c.mustContain)) {
      failures.push(`漏拦：${c.file} 本应报 ${c.mustContain}，实际 ${hits.map((h) => h.imported).join(',') || '无'}`);
    }
  }
  rmSync(dir, { force: true, recursive: true });

  if (failures.length > 0) {
    console.error(`❌ check-named-exports 自测失败（${failures.length} 项）：`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log(`✅ check-named-exports 自测通过：${cases.length} 个夹具，拦得住且不冤枉`);
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
    console.error(`❌ 存在指向不存在导出的具名导入（扫描 ${result.files} 个文件，违规 ${result.violations.length} 项）：`);
    for (const v of result.violations) console.error(`  - ${describe(v)}`);
    console.error('  说明：API 封装由 bash/gen-contract.py 生成，后端改名后请同步视图导入名，或用 `生成名 as 惯用名` 显式别名。');
    process.exit(1);
  }
  console.log(`✅ 本地具名导入检查通过：${result.files} 个源文件，无「导入了不存在的导出」`);
}

main();
