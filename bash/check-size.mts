#!/usr/bin/env node
/**
 * check-size.mts — 构建产物体积棘轮门禁（CI 侧）
 *
 * <p>与构建期 `YDSZ:bundle-budget` 插件共用 `conf/vite-config/src/plugins/budget-config.ts`
 * 里的阈值读取、目录口径与判据，因此"本地构建绿了但 CI 说超标"这类双轨不一致不再可能。
 *
 * <p>本文件的存在意义不是"再看一次体积"，而是补上构建期门禁的两个盲区：
 * <ul>
 *   <li>漏构建：某个应用本轮根本没产出。旧实现在这里 `continue` 静默跳过，
 *       而它扫描的目录（dist/assets）在本仓产物布局（dist/js、dist/css、dist/jse）里
 *       永远不存在——CI 门禁因此常年空转却报"通过"。现在 CI 下缺产物直接失败。</li>
 *   <li>漏登记：conf/budget.config.json 里没有这个应用的条目。旧实现靠 scope 首段兜底，
 *       新增应用会落到别人身上；现在按构建目录精确匹配，兜底目标只作为组内默认。</li>
 * </ul>
 *
 * <p>阈值是棘轮（上次实测 + 头寸），重新基线用 `--report` 生成片段，不手改数字。
 *
 * @usage
 *   node bash/check-size.mts              # 校验全部预算，超限/CI 缺产物即退出码 1
 *   node bash/check-size.mts --list       # 只列扫描结果，不做失败退出
 *   node bash/check-size.mts --report     # 输出实测值与建议棘轮阈值（JSON 片段，用于重新基线）
 *   node bash/check-size.mts --self-test  # 反例自检：确认本门禁真的会红
 *
 * @path bash\check-size.mts
 * @author ydsz-team
 * @since 26.10.25
 */

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';

import type {
  BudgetConfig,
  BudgetMeasure,
  BudgetTarget,
  ResolvedBudgetTarget,
} from '../conf/vite-config/src/plugins/budget-config.ts';
import {
  budgetViolations,
  expandBudgetTargets,
  findRepoRoot,
  formatKB,
  isBudgetConfig,
  loadBudgetConfig,
  matchBudgetTarget,
  measureDistDir,
  suggestRatchet,
} from '../conf/vite-config/src/plugins/budget-config.ts';

const LIST_ONLY = process.argv.includes('--list');
const REPORT = process.argv.includes('--report');
const SELF_TEST = process.argv.includes('--self-test');
const IS_CI = process.env.CI === 'true' || process.env.CI === '1';

/** 单个构建目录的校验结果 */
interface SizeRow {
  /** 目标名 */
  name: string;
  /** 相对仓库根的构建目录 */
  relDir: string;
  /** 实测画像 */
  measure: BudgetMeasure;
  /** 超限明细（空即合格） */
  violations: string[];
}

/** 一轮校验的汇总 */
interface SizeReport {
  /** 合格与超限的目录 */
  rows: SizeRow[];
  /** 声明为应用但没有产物的目录（CI 视为门禁失效） */
  missingDist: string[];
  /** 有产物但没有 JS/CSS 的目录 */
  emptyDist: string[];
}

/**
 * 该目录是否是纳入体积门禁的 web 应用。
 *
 * <p>判据用 package.json 的名字而不是"目录里有 vite.config"：docs-site、脚手架模板
 * 之类不该被子应用预算兜底目标管住的目录，名字都不以 -web 结尾。
 *
 * @param absDir 目录绝对路径
 * @returns 是否为受管应用
 */
function isWebAppDir(absDir: string): boolean {
  try {
    const pkg = JSON.parse(readFileSync(join(absDir, 'package.json'), 'utf8'));
    return typeof pkg.name === 'string' && pkg.name.startsWith('@ydsz/') && pkg.name.endsWith('-web');
  } catch {
    return false;
  }
}

/**
 * 展开预算目标到实际构建目录，并按应用性质过滤。
 *
 * @param config 预算配置
 * @param root 仓库根绝对路径
 * @returns 去重后的待校验目录（同一目录命中多目标时保留精确目标）
 */
function resolveScanDirs(config: BudgetConfig, root: string): ResolvedBudgetTarget[] {
  const seen = new Map<string, ResolvedBudgetTarget>();
  for (const item of expandBudgetTargets(config, root)) {
    if (item.relDir.split('/').length === 1) {
      // 顶层目录（main）：本身就是应用
    } else if (!isWebAppDir(item.absDir)) {
      continue;
    }
    const previous = seen.get(item.relDir);
    // 精确 appDir 条目优先于 `apps/*` 这类兜底条目
    if (previous && !previous.target.appDir.includes('*') && item.target.appDir.includes('*')) {
      continue;
    }
    seen.set(item.relDir, item);
  }
  return [...seen.values()];
}

/**
 * 遍历全部受管应用，产出体积画像与超限明细。
 *
 * @param config 预算配置
 * @param root 仓库根绝对路径
 * @returns 校验汇总
 */
function checkAll(config: BudgetConfig, root: string): SizeReport {
  const report: SizeReport = { rows: [], missingDist: [], emptyDist: [] };
  for (const { target, relDir, absDir } of resolveScanDirs(config, root)) {
    const measure = measureDistDir(absDir);
    if (!measure.exists) {
      report.missingDist.push(relDir);
      continue;
    }
    if (measure.jsFiles === 0 && measure.maxCssGzipKB === 0) {
      report.emptyDist.push(relDir);
      continue;
    }
    report.rows.push({ name: displayName(target, relDir), relDir, measure, violations: budgetViolations(target, measure) });
  }
  return report;
}

/**
 * 日志里用实际目录名而不是兜底目标名，避免 9 行都写着 sub-app。
 *
 * @param target 预算目标
 * @param relDir 实际构建目录
 * @returns 展示名
 */
function displayName(target: BudgetTarget, relDir: string): string {
  return target.appDir.includes('*') ? `${basename(relDir)}（${target.name}）` : target.name;
}

/**
 * 打印一轮校验结果并给出退出码。
 *
 * @param config 预算配置
 * @param root 仓库根绝对路径
 * @returns 进程退出码
 */
function printReport(config: BudgetConfig, root: string): number {
  const report = checkAll(config, root);
  let failures = 0;

  for (const row of report.rows) {
    failures += row.violations.length > 0 ? 1 : 0;
    const status = row.violations.length === 0 ? '✓' : `❌ ${row.violations.join('；')}`;
    console.log(
      `[check:size] ${row.name}: 总量 ${formatKB(row.measure.totalGzipKB)} / 预算 ${pickBudget(config, row)}KB(gzip)` +
        ` · JS ${row.measure.jsFiles} 个 · 最大 chunk ${formatKB(row.measure.maxChunkGzipKB)}` +
        ` · 最大 CSS ${formatKB(row.measure.maxCssGzipKB)} ${status}`,
    );
    for (const violation of row.violations) {
      console.log(`           ↳ ${violation}`);
    }
  }

  if (report.emptyDist.length > 0) {
    console.log(`[check:size] 有目录但无任何 JS/CSS 产物：${report.emptyDist.join(', ')}`);
    if (IS_CI && !LIST_ONLY) {
      console.error('[check:size] ❌ CI 下视为门禁失效：这些应用本轮没有产出可校验的 bundle。');
      failures += report.emptyDist.length;
    }
  }
  if (report.missingDist.length > 0) {
    console.log(`[check:size] 未找到产物目录：${report.missingDist.join(', ')}`);
    if (IS_CI && !LIST_ONLY) {
      console.error(
        '[check:size] ❌ CI 下缺产物即门禁空转（历史上正是这里 continue 掉了整条规则）。请先跑 pnpm build。',
      );
      failures += report.missingDist.length;
    }
  }

  if (report.rows.length === 0 && report.missingDist.length === 0) {
    console.error('[check:size] ❌ 预算里没有任何可扫描的应用目录，配置与仓库布局已脱节。');
    return 1;
  }

  if (failures > 0) {
    console.error(`\n[check:size] ${failures} 项目标超限或门禁失效，请拆分 chunk / 收紧依赖；确属新基线用 pnpm check:size --report。`);
    return 1;
  }
  console.log(`[check:size] ${report.rows.length} 个应用产物均在预算内 ✓`);
  return 0;
}

/**
 * 取该行对应的总体积预算（仅用于日志展示）。
 *
 * @param config 预算配置
 * @param row 校验行
 * @returns 预算 KB
 */
function pickBudget(config: BudgetConfig, row: SizeRow): number {
  const target = config.targets.find((item) => item.appDir === row.relDir) ??
    config.targets.find((item) => row.relDir.startsWith(item.appDir.replace('/*', '/')));
  return target?.maxTotalGzipKB ?? 0;
}

/**
 * 输出重新基线所需的实测表与建议棘轮阈值。
 *
 * @param config 预算配置
 * @param root 仓库根绝对路径
 * @returns 进程退出码
 */
function printRatchetProposal(config: BudgetConfig, root: string): number {
  const report = checkAll(config, root);
  console.log('[check:size] 实测值（gzip KB）与建议棘轮阈值：\n');
  const fragment = report.rows
    .filter((row) => row.measure.jsFiles > 0)
    .map((row) => {
      const suggested = suggestRatchet(row.measure);
      return {
        name: row.relDir.split('/').length === 1 ? row.relDir : basename(row.relDir),
        scope: row.relDir.split('/')[0],
        appDir: row.relDir,
        ...suggested,
        baseline: {
          measuredAt: new Date().toISOString().slice(0, 10),
          totalGzipKB: row.measure.totalGzipKB,
          maxChunkGzipKB: row.measure.maxChunkGzipKB,
          maxCssGzipKB: row.measure.maxCssGzipKB,
          jsFiles: row.measure.jsFiles,
        },
      };
    });
  console.log(JSON.stringify({ version: config.version, gzip: true, targets: fragment }, null, 2));
  console.log('\n[check:size] 用上面片段替换 conf/budget.config.json 的 targets，并按需保留 aspirationGzipKB。');
  return 0;
}

// ======================================================================
// 反例自检：证明门禁真的会红，而不是"永远通过"
// ======================================================================

/**
 * 生成不可压缩的伪随机内容。
 *
 * <p>夹具必须用真实可 gzip 的字节：'x'.repeat(9000) gzip 后只剩几十字节，
 * "超预算"的反例根本不超限，自检会假装一切正常——这正是要防的空转。
 *
 * @param length 字节数
 * @param seed xorshift32 种子（固定即可复现）
 * @returns 伪随机缓冲区
 */
function pseudoRandomBytes(length: number, seed: number): Buffer {
  const buffer = Buffer.alloc(length);
  let state = (seed >>> 0) || 0x9e37_79b9;
  for (let index = 0; index < length; index += 1) {
    state ^= state << 13;
    state >>>= 0;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    // 取高位字节：xorshift 低位周期极短，按位取低 8 位会得到可压缩的重复模式
    buffer[index] = (state >>> 24) & 0xff;
  }
  return buffer;
}

/**
 * 造一个临时仓库夹具：两个应用，一个超预算、一个合格，另有一个声明了但没产物。
 *
 * @returns 夹具仓库根
 */
function writeSizeFixture(): string {
  const root = mkdtempSync(join(tmpdir(), 'ydsz-size-'));
  writeFileSync(join(root, 'pnpm-workspace.yaml'), 'packages: []\n');
  mkdirSync(join(root, 'conf'), { recursive: true });
  const config: BudgetConfig = {
    version: 'self-test',
    gzip: true,
    targets: [
      {
        name: 'sub-app-default',
        scope: 'apps',
        appDir: 'apps/*',
        maxTotalGzipKB: 20,
        maxFiles: 3,
        maxChunkGzipKB: 12,
        maxCssGzipKB: 6,
      },
      {
        name: 'over-web',
        scope: 'apps',
        appDir: 'apps/over-web',
        maxTotalGzipKB: 20,
        maxFiles: 3,
        maxChunkGzipKB: 4,
        maxCssGzipKB: 6,
        baseline: { measuredAt: '2026-01-01', totalGzipKB: 3, maxChunkGzipKB: 3, maxCssGzipKB: 0, jsFiles: 1 },
      },
    ],
  };
  writeFileSync(join(root, 'conf', 'budget.config.json'), JSON.stringify(config, null, 2));
  for (const app of ['over-web', 'ok-web', 'ghost-web']) {
    mkdirSync(join(root, 'apps', app), { recursive: true });
    writeFileSync(
      join(root, 'apps', app, 'package.json'),
      JSON.stringify({ name: `@ydsz/${app}`, scripts: { build: 'vite build' } }),
    );
  }
  // 产物布局与本仓一致：dist/js、dist/css（旧实现扫 dist/assets，永远扫不到）
  mkdirSync(join(root, 'apps', 'over-web', 'dist', 'js'), { recursive: true });
  writeFileSync(join(root, 'apps', 'over-web', 'dist', 'js', 'chunk.js'), pseudoRandomBytes(30_000, 7));
  mkdirSync(join(root, 'apps', 'ok-web', 'dist', 'js'), { recursive: true });
  writeFileSync(join(root, 'apps', 'ok-web', 'dist', 'js', 'chunk.js'), pseudoRandomBytes(1_200, 11));
  return root;
}

/**
 * 跑反例自检：断言"超限会红、合格会绿、缺产物会红、精确目标优先"。
 *
 * @returns 进程退出码
 */
function selfTest(): number {
  const root = writeSizeFixture();
  const failures: string[] = [];
  try {
    const config = loadBudgetConfig(root);
    if (!config) {
      return fail('夹具预算配置未被读取（findRepoRoot / loadBudgetConfig 已失效）');
    }

    const report = checkAll(config, root);

    // 1. 超限应用必须报出 chunk 超限
    const over = report.rows.find((row) => row.relDir === 'apps/over-web');
    if (!over || over.violations.length === 0) {
      failures.push('单 chunk 超预算没有被判红');
    } else if (!over.violations.some((v) => v.includes('最大 JS chunk'))) {
      failures.push(`chunk 超限判据文案异常：${over.violations.join('；')}`);
    }

    // 2. 精确目标必须压过 apps/* 兜底目标（否则新应用的漏登记会被默认值掩盖）
    if (over && over.name !== 'over-web') {
      failures.push(`精确 appDir 目标未被优先选中，实际用的是 ${over.name}`);
    }

    // 3. 合格应用不得误报
    const ok = report.rows.find((row) => row.relDir === 'apps/ok-web');
    if (!ok || ok.violations.length > 0) {
      failures.push(`合格应用被误判：${ok?.violations.join('；') ?? '未扫描到'}`);
    }

    // 4. 声明了应用但无产物，必须进 missingDist（旧实现在这里静默 continue）
    if (!report.missingDist.includes('apps/ghost-web')) {
      failures.push('缺产物的应用没有被记入 missingDist（门禁空转的入口）');
    }

    // 5. 建议阈值必须严格高于实测，否则棘轮一提交就自锁
    const proposal = suggestRatchet(over?.measure ?? { exists: true, measuredAt: '', totalGzipKB: 0, maxChunkGzipKB: 0, maxCssGzipKB: 0, jsFiles: 0 });
    if (over && !(proposal.maxChunkGzipKB > over.measure.maxChunkGzipKB)) {
      failures.push('建议棘轮阈值不大于实测值');
    }

    // 6. 旧 schema（无 appDir）必须被结构校验拒绝，防止配置回退成空转
    const legacyShaped = { targets: [{ name: 'x', scope: 'apps', assetsDirPattern: 'apps/*/dist/assets' }] };
    if (isBudgetConfig(legacyShaped)) {
      failures.push('缺少 appDir 的旧结构仍被判定为合法配置');
    }

    // 7. 构建目录匹配：apps/foo-web 命中兜底，foo 库目录不命中任何目标
    if (!matchBudgetTarget(config, join(root, 'apps', 'ok-web'))) {
      failures.push('matchBudgetTarget 未把应用目录匹配到兜底目标');
    }
    if (matchBudgetTarget(config, join(root, 'conf', 'vite-config'))) {
      failures.push('非应用目录被匹配到了体积目标');
    }

    // 8. 夹具前提必须成立：内容真要不可压缩。'x'.repeat(9000) 一度让"超预算"反例
    //    gzip 后只剩几十字节，超限断言静默变成永不触发——自检反而因此成了摆设。
    if (over && over.measure.maxChunkGzipKB < 20) {
      failures.push(
        `夹具 chunk 实测仅 ${formatKB(over.measure.maxChunkGzipKB)}（应约 30KB），反例内容已可压缩，自检不可信`,
      );
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }

  if (failures.length > 0) {
    console.error(`[check:size] 自检失败（门禁已空转，请勿合入）：\n  - ${failures.join('\n  - ')}`);
    return 1;
  }
  console.log(
    '✅ check:size 自检通过：8 项反例断言（chunk 超限判红 / 精确目标优先 / 合格不误报 / ' +
      '缺产物记账 / 棘轮大于实测 / 旧 schema 拒绝 / 目录匹配边界 / 夹具内容不可压缩）',
  );
  return 0;
}

/**
 * 直接失败退出。
 *
 * @param message 原因
 * @returns 永不返回
 */
function fail(message: string): never {
  console.error(`[check:size] ❌ ${message}`);
  process.exit(1);
}

// ======================================================================
// 主流程
// ======================================================================

if (SELF_TEST) {
  process.exit(selfTest());
}

const repoRoot = findRepoRoot(process.cwd()) ?? join(import.meta.dirname, '..');
const budgetConfig = loadBudgetConfig(repoRoot);
if (!budgetConfig) {
  fail(`预算配置不可读或结构非法：${join(repoRoot, 'conf', 'budget.config.json')}`);
}

if (REPORT) {
  process.exit(printRatchetProposal(budgetConfig, repoRoot));
}

const exitCode = printReport(budgetConfig, repoRoot);
if (LIST_ONLY) {
  process.exit(0);
}
process.exit(exitCode);
