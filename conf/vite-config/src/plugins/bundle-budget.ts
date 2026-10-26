/**
 * Bundle Budget 插件 — 构建产物体积棘轮校验
 *
 * <p>在 Vite 写完产物后按 `conf/budget.config.json`（单一事实源）校验
 * 「总产出 / JS 文件数 / 单个 JS chunk / 单个 CSS 文件」，超限时以非零退出码阻断构建。
 * 判据与 CI 侧 `bash/check-size.mts` 完全共用 `budget-config.ts`，杜绝历史上
 * 「构建期 5MB/15MB、CI 期 512KB/384KB」的双轨口径。
 *
 * <p>阈值是棘轮（实测 + 头寸），不是理想值：本地/CI 全绿才有资格谈阻断回退。
 * 重新基线用 `pnpm check:size --report`，它按同一份头寸规则产出配置片段。
 *
 * @path conf/vite-config/src/plugins/bundle-budget.ts
 * @author ydsz-team
 * @since 26.10.25
 */
import type { Plugin } from 'rollup';

import { consola as logger } from 'consola';

import type { BudgetMeasure, BudgetTarget } from './budget-config';
import {
  budgetViolations,
  formatKB,
  gzipSizeKB,
  loadBudgetConfig,
  matchBudgetTarget,
  roundKB,
} from './budget-config';

/** Bundle Budget 配置选项 */
export interface BundleBudgetOptions {
  /** 是否在超限时失败构建（CI 建议 true），默认 true */
  failOnExceed?: boolean;
  /** 显式指定预算目标；省略时按 cwd 匹配 conf/budget.config.json */
  target?: BudgetTarget;
  /** 配置查找起始目录，默认 process.cwd() */
  cwd?: string;
}

/**
 * 把 Rollup 产物列表折算成与 CI 侧同口径的体积画像。
 *
 * @param assets 产物 gzip 画像
 * @returns 体积画像（exists 恒为 true，产物已在内存里）
 */
function toMeasure(assets: { fileName: string; gzipKB: number; type: 'css' | 'js' }[]): BudgetMeasure {
  const measure: BudgetMeasure = {
    exists: true,
    measuredAt: '',
    totalGzipKB: 0,
    maxChunkGzipKB: 0,
    maxCssGzipKB: 0,
    jsFiles: 0,
  };
  for (const asset of assets) {
    measure.totalGzipKB += asset.gzipKB;
    if (asset.type === 'css') {
      measure.maxCssGzipKB = Math.max(measure.maxCssGzipKB, asset.gzipKB);
    } else {
      measure.jsFiles += 1;
      measure.maxChunkGzipKB = Math.max(measure.maxChunkGzipKB, asset.gzipKB);
    }
  }
  measure.totalGzipKB = roundKB(measure.totalGzipKB);
  measure.maxChunkGzipKB = roundKB(measure.maxChunkGzipKB);
  measure.maxCssGzipKB = roundKB(measure.maxCssGzipKB);
  return measure;
}

/**
 * 创建 Bundle Budget 校验插件。
 *
 * @param options 阈值配置与查找入口
 * @returns Rollup 插件实例
 */
export function bundleBudgetPlugin(options: BundleBudgetOptions = {}): Plugin {
  const failOnExceed = options.failOnExceed ?? true;
  const searchCwd = options.cwd ?? process.cwd();
  const assets: { fileName: string; gzipKB: number; type: 'css' | 'js' }[] = [];
  let target: BudgetTarget | null = options.target ?? null;
  let configResolved = Boolean(options.target);
  /** 配置读到但没有匹配目标：新应用漏登记预算，属于门禁逃逸，必须阻断 */
  let unmatchedTarget = false;

  return {
    name: 'YDSZ:bundle-budget',

    buildStart() {
      if (configResolved) return;
      const config = loadBudgetConfig(searchCwd);
      if (!config) {
        logger.warn(
          `📦 未读到预算配置 conf/budget.config.json（cwd=${searchCwd}），本次构建跳过体积校验；` +
            `CI 侧 pnpm check:size 会因配置不可读直接失败，不会静默放行。`,
        );
        configResolved = true;
        return;
      }
      target = matchBudgetTarget(config, searchCwd);
      configResolved = true;
      if (!target) {
        unmatchedTarget = true;
        logger.warn(
          `📦 conf/budget.config.json 没有覆盖当前构建目录（cwd=${searchCwd}）：` +
            `新增应用必须显式登记预算，否则它永远不会被体积门禁管住。`,
        );
      }
    },

    generateBundle(_opts, bundle) {
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (fileName.endsWith('.map')) continue;

        let type: 'css' | 'js';
        if (fileName.endsWith('.js') || fileName.endsWith('.mjs')) {
          type = 'js';
        } else if (fileName.endsWith('.css')) {
          type = 'css';
        } else {
          continue;
        }

        const code =
          'code' in chunk && typeof chunk.code === 'string'
            ? chunk.code
            : 'source' in chunk && typeof chunk.source === 'string'
              ? chunk.source
              : '';
        assets.push({ fileName, type, gzipKB: gzipSizeKB(code) });
      }
    },

    writeBundle() {
      if (assets.length === 0) return;

      if (unmatchedTarget || !target) {
        if (failOnExceed) {
          this.error(
            '未匹配到体积预算目标 — 请在 conf/budget.config.json 为目标目录补一条 `appDir` 精确条目' +
              '（可用 pnpm check:size --report 生成建议阈值）。',
          );
        }
        return;
      }

      const measure = toMeasure(assets);
      const violations = budgetViolations(target, measure);
      // 逐文件明细只在超限时给，指明该拆谁
      const offenders = assets
        .filter(
          (asset) =>
            (asset.type === 'js' && asset.gzipKB > target.maxChunkGzipKB) ||
            (asset.type === 'css' && asset.gzipKB > target.maxCssGzipKB),
        )
        .map(
          (asset) =>
            `  ❌ ${asset.type === 'js' ? 'JS chunk' : 'CSS'} ${asset.fileName} ` +
            `${formatKB(asset.gzipKB)} > ${asset.type === 'js' ? target.maxChunkGzipKB : target.maxCssGzipKB}KB`,
        );

      const summary =
        `JS+CSS 合计 ${formatKB(measure.totalGzipKB)} / 预算 ${target.maxTotalGzipKB}KB（gzip）` +
        ` · JS ${measure.jsFiles} 个 / 预算 ${target.maxFiles}`;

      if (violations.length === 0) {
        const aspiration = target.aspirationGzipKB
          ? ` · 架构目标 ${target.aspirationGzipKB}KB（尚有 ${formatKB(Math.max(0, measure.totalGzipKB - target.aspirationGzipKB))} 压缩空间）`
          : '';
        logger.info(`\n📦 Bundle Budget 通过（${target.name}）: ${summary}${aspiration}\n`);
        return;
      }

      logger.warn(`\n📦 Bundle Budget 校验失败（${target.name}）:`);
      for (const violation of violations) {
        logger.warn(`  ❌ ${violation}`);
      }
      if (offenders.length > 0) {
        logger.warn(offenders.join('\n'));
      }
      logger.warn(
        `\n  ${summary}\n  基线：${target.baseline ? `${formatKB(target.baseline.totalGzipKB)}（${target.baseline.measuredAt} 实测）` : '无留档实测值'}\n` +
          '  处理：拆分 chunk / 懒加载重依赖 / 收紧依赖；确属必要的新基线用 pnpm check:size --report 重算并同 PR 提交。\n',
      );

      if (failOnExceed) {
        this.error('Bundle budget exceeded — 见上方明细，请拆分 chunk 或收紧依赖。');
      }
    },
  };
}
