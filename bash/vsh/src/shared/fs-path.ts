/**
 * @file vsh shared - 文件系统与路径别名解析工具
 * @author YDSZ Team
 * @since 2026-08-24
 * @description 供 check-arch / check-circular 复用：递归收集源码文件、解析 #/ 与 @ydsz/@YDSZ-core 别名。
 *              纯 Node 内置模块实现，零第三方依赖，契合「最小化外部依赖、绝对可控」原则。
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, join, extname } from 'node:path';

/** 纳入依赖图分析的源码扩展名 */
const SOURCE_EXTS = ['.ts', '.tsx', '.mts', '.cts', '.vue', '.js', '.mjs', '.cjs'];

/** 递归收集时跳过的目录 */
const IGNORE_DIRS = new Set(['node_modules', 'dist', 'coverage', '.git', '.husky', 'e2e', '.changeset']);

/**
 * 递归收集 rootDir 下指定顶层目录中的所有源码文件。
 * @param rootDir 项目根
 * @param dirs 需要扫描的顶层目录（默认 main / apps / comm）
 */
export function collectSourceFiles(rootDir: string, dirs: string[] = ['main', 'apps', 'comm']): string[] {
  const files: string[] = [];
  for (const dir of dirs) {
    walk(resolve(rootDir, dir), files);
  }
  return files;
}

function walk(dir: string, files: string[]): void {
  if (!existsSync(dir)) return;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (e.isDirectory()) {
      if (IGNORE_DIRS.has(e.name)) continue;
      walk(join(dir, e.name), files);
    } else if (e.isFile()) {
      if (SOURCE_EXTS.includes(extname(e.name))) files.push(join(dir, e.name));
    }
  }
}

/**
 * 加载 tsconfig.paths.json 的 paths 映射（用于 @ydsz/*、@YDSZ-core/* 别名解析）。
 */
export function loadPathMapping(rootDir: string): Record<string, string[]> {
  try {
    const raw = JSON.parse(readFileSync(resolve(rootDir, 'tsconfig.paths.json'), 'utf-8'));
    return (raw.compilerOptions && raw.compilerOptions.paths) || {};
  } catch {
    return {};
  }
}

/**
 * 向上查找文件所属 package 根目录（用于 #/ 别名解析到「当前包 src」）。
 */
function findPackageRoot(filePath: string): string | null {
  let dir = dirname(filePath);
  for (let i = 0; i < 12; i++) {
    if (existsSync(join(dir, 'package.json'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
}

/**
 * 为无扩展名解析结果补全扩展名 / index 入口。
 */
function resolveWithExt(base: string): string | null {
  if (existsSync(base) && statSync(base).isFile()) return base;
  for (const ext of SOURCE_EXTS) {
    if (existsSync(base + ext)) return base + ext;
  }
  for (const ext of SOURCE_EXTS) {
    const idx = join(base, 'index' + ext);
    if (existsSync(idx)) return idx;
  }
  return null;
}

/**
 * 匹配 tsconfig paths 中的键（支持 * 通配），返回解析后的绝对路径。
 */
function matchTsPath(key: string, targets: string[], spec: string, rootDir: string): string | null {
  if (key.endsWith('/*')) {
    const prefix = key.slice(0, -2);
    if (spec.startsWith(prefix)) {
      const rest = spec.slice(prefix.length);
      for (const t of targets) {
        const mapped = t.replace(/\/\*$/, '') + rest;
        const abs = resolveWithExt(resolve(rootDir, mapped));
        if (abs) return abs;
      }
    }
    return null;
  }
  if (spec === key) {
    for (const t of targets) {
      const abs = resolveWithExt(resolve(rootDir, t));
      if (abs) return abs;
    }
  }
  return null;
}

/**
 * 将一个 import specifier 解析为项目内绝对文件路径。
 * 第三方包（node_modules）返回 null，不参与依赖图。
 *
 * @param spec import 来源字符串
 * @param importer 当前文件路径（用于相对路径与 #/ 解析）
 * @param rootDir 项目根
 * @param paths tsconfig paths 映射
 */
export function resolveSpecifier(
  spec: string,
  importer: string,
  rootDir: string,
  paths: Record<string, string[]>,
): string | null {
  // 相对路径
  if (spec.startsWith('.')) {
    return resolveWithExt(resolve(dirname(importer), spec));
  }
  // 包内别名 #/ -> 当前包 src
  if (spec.startsWith('#/')) {
    const pkgRoot = findPackageRoot(importer) || rootDir;
    return resolveWithExt(resolve(pkgRoot, 'src', spec.slice(2)));
  }
  // 工作区别名 @ydsz/* / @YDSZ-core/*
  if (spec.startsWith('@')) {
    for (const [key, targets] of Object.entries(paths)) {
      const hit = matchTsPath(key, targets, spec, rootDir);
      if (hit) return hit;
    }
  }
  return null;
}

/**
 * 从文件内容提取静态 import/export 的 specifier，用于「初始化期」依赖图。
 *
 * 排除规则（避免循环依赖误报/过度严格）：
 * - 整行 `import type` / `export type`：编译后擦除，不构成运行时依赖。
 * - 动态 `import("x")` / `import("x").Type`：属于运行期懒加载或内联类型查询，不阻塞模块初始化，
 *   不计入初始化期循环（业界主流工具 madge/dependency-cruiser 同此默认）。此类导入本就是打破循环的惯用法。
 *
 * 仅保留静态 `from 'x'` 与 `export * from 'x'` 作为依赖边。
 */
export function extractSpecifiers(content: string): string[] {
  const specs: string[] = [];
  const lines = content.split('\n');
  const staticRe = /(?:from\s*|export\s+\*\s+from\s+)['"]([^'"]+)['"]/g;
  for (const line of lines) {
    if (/^\s*import\s+type\s/.test(line)) continue;
    if (/^\s*export\s+type\s/.test(line)) continue;
    let m;
    while ((m = staticRe.exec(line)) !== null) {
      specs.push(m[1]);
    }
  }
  return specs;
}
