#!/usr/bin/env node
/**
 * check-size.mjs — 构建产物体积预算校验
 *
 * 预算来自 conf/budget.config.json（单一事实源，与构建期 bundle-budget 插件共享），
 * 口径统一为 gzip，与 nginx Brotli/Gzip 实际传输体积对齐。扫描 dist 产物，
 * 对「总 gzip 体积 / JS 文件数 / 单个 JS chunk / 单个 CSS 文件」四项做断言，
 * 超限退出码非 0，用于在 CI 中尽早阻断产物膨胀。
 *
 * v26.09.14 修复：
 *   - 预算改读 conf/budget.config.json，消除与 bundle-budget 插件的双轨矛盾；
 *   - 修正「产物目录不存在即静默通过」的隐患：CI 环境下无产物视为门禁失效并失败，
 *     本地环境下仅告警（本地未构建属常态）。
 *
 * @usage
 *   node bash/check-size.mjs            # 校验全部预算
 *   node bash/check-size.mjs --list     # 仅列出扫描结果，不做失败退出
 *
 * @path bash\check-size.mjs
 * @author ydsz-team
 * @since 4.4.0
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const MICRO_ROOT = join(import.meta.dirname, '..');
const BUDGET_CONFIG_PATH = join(MICRO_ROOT, 'conf', 'budget.config.json');
const LIST_ONLY = process.argv.includes('--list');

/** 预算校验涉及的产物扩展名 */
const ASSET_EXTENSIONS = ['.js', '.css'];

/**
 * 读取并解析预算单一事实源配置。
 *
 * @return 预算配置对象（含 targets 数组）
 * @throws 配置文件缺失或格式非法时抛出，避免门禁静默失效
 */
function loadBudgetConfig() {
  let raw;
  try {
    raw = readFileSync(BUDGET_CONFIG_PATH, 'utf8');
  } catch (err) {
    console.error(`[check:size] 预算配置不可读: ${BUDGET_CONFIG_PATH} (${err.message})`);
    process.exit(1);
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[check:size] 预算配置不是合法 JSON: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 将配置中的产物目录模式展开为具体校验目标。
 *
 * <p>含 `*` 的模式按 apps/ 下的实际子应用目录展开，与 vsh check-bundle 的
 * 子应用枚举口径保持一致。
 *
 * @param config 预算配置对象
 * @return 展开后的校验目标数组（每项含 dir / 各预算阈值）
 */
function expandTargets(config) {
  const expanded = [];
  for (const target of config.targets ?? []) {
    if (!target.assetsDirPattern.includes('*')) {
      expanded.push({ ...target, dir: target.assetsDirPattern });
      continue;
    }
    const appsDir = join(MICRO_ROOT, 'apps');
    if (!statSync(appsDir, { throwIfNoEntry: false })) continue;
    const appNames = readdirSync(appsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
      .map((entry) => entry.name);
    for (const appName of appNames) {
      expanded.push({
        ...target,
        dir: target.assetsDirPattern.replace('*', appName),
        name: `${appName}(${target.name})`,
      });
    }
  }
  return expanded;
}

/**
 * 递归收集目录树下所有文件的绝对路径。
 *
 * @param dirPath 起始目录
 * @return 文件绝对路径列表
 */
function walk(dirPath) {
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

/**
 * 统计单个产物目录的体积画像。
 *
 * @param absDir 产物目录绝对路径
 * @return 统计结果（总 gzip 字节 / JS 文件数 / 最大 JS chunk / 最大 CSS）
 */
function measureDir(absDir) {
  const files = walk(absDir).filter(
    (p) => !p.endsWith('.map') && ASSET_EXTENSIONS.some((ext) => p.endsWith(ext)),
  );
  const stats = { totalGzipBytes: 0, jsCount: 0, maxChunkGzipBytes: 0, maxCssGzipBytes: 0 };
  for (const file of files) {
    const gzipBytes = gzipSync(readFileSync(file)).length;
    stats.totalGzipBytes += gzipBytes;
    if (file.endsWith('.js')) {
      stats.jsCount += 1;
      stats.maxChunkGzipBytes = Math.max(stats.maxChunkGzipBytes, gzipBytes);
    } else {
      stats.maxCssGzipBytes = Math.max(stats.maxCssGzipBytes, gzipBytes);
    }
  }
  return stats;
}

// ======================================================================
// 主流程
// ======================================================================

const budgetConfig = loadBudgetConfig();
const targets = expandTargets(budgetConfig);

let failures = 0;
let scannedTargets = 0;

for (const target of targets) {
  const absDir = join(MICRO_ROOT, target.dir);
  if (!statSync(absDir, { throwIfNoEntry: false })?.isDirectory()) continue;

  const stats = measureDir(absDir);
  if (stats.jsCount === 0 && stats.maxCssGzipBytes === 0) continue;
  scannedTargets += 1;

  const totalGzipKB = Math.round(stats.totalGzipBytes / 1024);
  const maxChunkGzipKB = Math.round(stats.maxChunkGzipBytes / 1024);
  const maxCssGzipKB = Math.round(stats.maxCssGzipBytes / 1024);

  const violations = [];
  if (totalGzipKB > target.maxTotalGzipKB) {
    violations.push(`总量 ${totalGzipKB}KB > ${target.maxTotalGzipKB}KB`);
  }
  if (stats.jsCount > target.maxFiles) {
    violations.push(`JS 文件数 ${stats.jsCount} > ${target.maxFiles}`);
  }
  if (maxChunkGzipKB > target.maxChunkGzipKB) {
    violations.push(`单 chunk ${maxChunkGzipKB}KB > ${target.maxChunkGzipKB}KB`);
  }
  if (maxCssGzipKB > target.maxCssGzipKB) {
    violations.push(`单 CSS ${maxCssGzipKB}KB > ${target.maxCssGzipKB}KB`);
  }

  const status = violations.length === 0 ? '✓' : `❌ 超限：${violations.join('；')}`;
  console.log(
    `[check:size] ${target.name}: 总量 ${totalGzipKB}KB(gzip) / JS ${stats.jsCount} 个` +
      ` / 最大 chunk ${maxChunkGzipKB}KB / 最大 CSS ${maxCssGzipKB}KB ${status}`,
  );

  if (violations.length > 0) failures += 1;
}

if (scannedTargets === 0) {
  const message =
    '[check:size] 未发现任何构建产物目录，请先执行构建（如 pnpm build:main）。' +
    ' CI 环境下将视为门禁失效。';
  if (process.env.CI && !LIST_ONLY) {
    console.error(message);
    process.exit(1);
  }
  console.warn(message);
  process.exit(0);
}

if (LIST_ONLY) {
  process.exit(0);
}

if (failures > 0) {
  console.error(`\n[check:size] ${failures} 项产物体积超出预算，请拆分 chunk 或收紧依赖。`);
  process.exit(1);
}
console.log(`[check:size] ${scannedTargets} 项产物均在预算内 ✓`);
