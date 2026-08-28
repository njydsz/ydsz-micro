#!/usr/bin/env node
/**
 * check-size.mjs — 构建产物体积预算校验
 *
 * 扫描 dist 产物（默认构建目录），对匹配文件的原始/gzip 体积与文件数量
 * 做预算断言，超限退出码非 0。对标 Lighthouse CI 资源预算的轻量替代，
 * 用于在 CI 中尽早阻断产物膨胀；完整性能预算后续由 lighthouserc 承接。
 *
 * 设计契合「最小化外部依赖、绝对可控」原则：零第三方依赖，原生 Node 实现
 * （glob 以受限通配符表达，见 toMatcher）。
 *
 * 用法:
 *   node bash/check-size.mjs                     # 校验全部预算
 *   node bash/check-size.mjs --list              # 仅列出扫描结果
 *
 * @path bash/check-size.mjs
 * @author ydsz-team
 * @since 4.4.0
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, relative } from 'node:path';

const MICRO_ROOT = join(import.meta.dirname, '..');
const LIST_ONLY = process.argv.includes('--list');

/**
 * 体积预算表（gzip 口径，单位 KB）。
 * 基线取自 README「性能预算」章节：主应用 JS ≤ 512KB / ≤ 50 个文件。
 * 子应用共享依赖经 importmap 外置，入口增量小，暂设 384KB 预算。
 */
const BUDGETS = [
  { name: 'main-web JS 入口', dir: 'main/dist/assets', exts: ['.js'], maxGzipKB: 512, maxFiles: 50 },
  ...readdirSync(join(MICRO_ROOT, 'apps'))
    .filter((name) => !name.startsWith('.'))
    .map((name) => ({
      name: `${name} JS 入口`,
      dir: `apps/${name}/dist/assets`,
      exts: ['.js'],
      maxGzipKB: 384,
      maxFiles: 60,
    })),
];

/** 将受限通配符（`*` 与 `**`）转为可用的匹配函数，足够目录扫描场景 */
function makeMatch(dirPattern) {
  const regex = new RegExp(
    `^${dirPattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '::DSTAR::').replace(/\*/g, '[^/]*').replace(/::DSTAR::\//g, '(?:.*/)?')}$`,
  );
  return (p) => regex.test(p);
}

/** 递归收集目录下的相对文件路径 */
function walk(dirPath) {
  if (!statSync(dirPath, { throwIfNoEntry: false })) return [];
  const out = [];
  for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
    const full = join(dirPath, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

// ======================================================================
// 主流程
// ======================================================================

let failures = 0;

for (const budget of BUDGETS) {
  const absDir = join(MICRO_ROOT, budget.dir);
  const stat = statSync(absDir, { throwIfNoEntry: false });
  if (!stat || !stat.isDirectory()) continue; // 未构建则跳过（本地开发常态）

  const match = makeMatch(`${budget.dir}/**`);
  const assets = walk(absDir)
    .map((p) => relative(MICRO_ROOT, p).replaceAll('\\', '/'))
    .filter((p) => match(p))
    .filter((p) => budget.exts.some((ext) => p.endsWith(ext)));

  if (assets.length === 0) continue;

  let totalGzipBytes = 0;
  for (const asset of assets) {
    totalGzipBytes += gzipSync(readFileSync(asset)).length;
  }
  const totalGzipKB = Math.round(totalGzipBytes / 1024);
  const overSize = totalGzipKB > budget.maxGzipKB;
  const overFiles = assets.length > budget.maxFiles;

  console.log(
    `[check:size] ${budget.name}: ${assets.length} 个文件, ${totalGzipKB} KB(gzip)` +
      ` | 预算 ≤ ${budget.maxFiles} 个 / ≤ ${budget.maxGzipKB} KB` +
      (overSize ? ' ❌ 超限' : ' ✓'),
  );

  if (overSize || overFiles) failures += 1;
}

if (LIST_ONLY) {
  process.exit(0);
}

if (failures > 0) {
  console.error(`\n[check:size] ${failures} 项产物体积超出预算，请拆分 chunk 或收紧依赖。`);
  process.exit(1);
}
console.log('[check:size] 全部产物均在预算内 ✓');
