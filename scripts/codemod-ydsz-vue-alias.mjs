/**
 * 一次性 codemod：将 comm/@core/ui-kit/ydsz-vue/src 内所有 '@/...' 导入改写为相对导入。
 *
 * 背景：包以源码形式被 main-web 直接消费，'@/' 别名只有 vite 运行时插件支持，
 * @vue/compiler-sfc 解析 defineProps 泛型 extends 基类型时走 TS 类型解析，
 * 无法解析 '@/Primitive' 等，导致 "Failed to resolve extends base type" 构建失败。
 *
 * 规则：
 *  - '@/X' 若 X 是目录且有 index.ts → 解析到 X/index
 *  - 目标以 .vue 结尾 → 保留 .vue 扩展名
 *  - 其余（.ts 模块）→ 不带扩展名（vite / tsc bundler 解析均可）
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative, resolve, posix } from 'node:path';

const SRC = resolve(process.cwd(), 'comm/@core/ui-kit/ydsz-vue/src');

function walk(dir, out = []) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.(ts|vue|mts)$/.test(ent.name)) out.push(p);
  }
  return out;
}

function resolveTarget(path) {
  // 依次尝试：原样目录/文件、.ts、.mts
  const candidates = [path, `${path}.ts`, `${path}.mts`];
  for (const c of candidates) {
    const abs = resolve(SRC, c);
    if (!existsSync(abs)) continue;
    if (statSync(abs).isDirectory()) {
      const idx = join(abs, 'index.ts');
      if (existsSync(idx)) return idx;
      continue;
    }
    return abs;
  }
  return null;
}

function toRelative(fromFile, importPath) {
  const target = resolveTarget(importPath);
  let rel = relative(dirname(fromFile), target).replace(/\\/g, '/');
  if (!rel.startsWith('.')) rel = `./${rel}`;
  return rel;
}

// 匹配 from '@/...'、import('@/...')、export * from '@/...'
const RE = /(from\s*|import\()\s*(['"])@\/([^'"\n]+)\2/g;

let fileCount = 0;
let replCount = 0;

for (const file of walk(SRC)) {
  const src = readFileSync(file, 'utf8');
  let changed = false;
  const next = src.replace(RE, (m, lead, q, path) => {
    if (!resolveTarget(path)) return m; // 无法解析的目标保持原样（如 '@/test' 若不存在）
    changed = true;
    replCount++;
    return `${lead}${q}${toRelative(file, path)}${q}`;
  });
  if (changed) {
    writeFileSync(file, next, 'utf8');
    fileCount++;
  }
}

console.log(`done: ${fileCount} files modified, ${replCount} imports rewritten`);
