/**
 * Bundle Budget 插件 — 构建产物体积硬阈值校验
 *
 * 在 Vite 构建完成后扫描产物列表，按 `conf/budget.config.json`（单一事实源）
 * 的预算校验「单个 JS chunk / 单个 CSS 文件 / 单次构建总产出」，超限时以非零
 * 退出码阻断构建。口径统一为 gzip，与 CI `bash/check-size.mjs` 完全一致，
 * 消除此前构建期 5MB/15MB 与 CI 期 512KB/384KB 的双轨矛盾。
 *
 * @path conf/vite-config/src/plugins/bundle-budget.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { Plugin } from 'rollup';

import { consola as logger } from 'consola';

import type { BudgetTarget } from './budget-config';
import { gzipSizeKB, loadBudgetConfig, matchBudgetTarget } from './budget-config';

/** Bundle Budget 配置选项 */
export interface BundleBudgetOptions {
  /** 是否在超限时失败构建（CI 建议 true），默认 true */
  failOnExceed?: boolean;
  /** 显式指定预算目标；省略时按 cwd 匹配 conf/budget.config.json */
  target?: BudgetTarget;
  /** 配置查找起始目录，默认 process.cwd() */
  cwd?: string;
}

/** 单个产物的体积画像 */
interface AssetInfo {
  /** 产物文件名（含 hash） */
  fileName: string;
  /** 产物类型 */
  type: 'css' | 'js';
  /** gzip 后体积（KB） */
  gzipKB: number;
}

/**
 * 格式化体积数值用于日志输出。
 *
 * @param sizeKB 体积（KB）
 * @returns 保留一位小数的可读字符串
 */
function formatKB(sizeKB: number): string {
  return `${sizeKB.toFixed(1)}KB`;
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
  const assets: AssetInfo[] = [];
  let target: BudgetTarget | null = options.target ?? null;
  let configResolved = Boolean(options.target);

  return {
    name: 'YDSZ:bundle-budget',

    buildStart() {
      if (configResolved) return;
      const config = loadBudgetConfig(searchCwd);
      target = config ? matchBudgetTarget(config, searchCwd) : null;
      configResolved = true;
      if (!target) {
        // 配置缺失或当前构建目录不在预算目标范围内：仅告警不阻断，
        // 由 CI 的 `pnpm check:size` 承担强门禁职责（构建期插件服务于本地快速反馈）。
        logger.warn(
          `📦 未匹配到体积预算目标（conf/budget.config.json），本次构建跳过预算校验，cwd=${searchCwd}`,
        );
      }
    },

    generateBundle(_opts, bundle) {
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (fileName.endsWith('.map')) continue;

        let type: AssetInfo['type'];
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
      if (assets.length === 0 || !target) return;

      const violations: string[] = [];
      let totalGzipKB = 0;

      for (const asset of assets) {
        totalGzipKB += asset.gzipKB;
        if (asset.type === 'js' && asset.gzipKB > target.maxChunkGzipKB) {
          violations.push(
            `  ❌ JS chunk ${asset.fileName} ${formatKB(asset.gzipKB)} > ${target.maxChunkGzipKB}KB`,
          );
        }
        if (asset.type === 'css' && asset.gzipKB > target.maxCssGzipKB) {
          violations.push(
            `  ❌ CSS ${asset.fileName} ${formatKB(asset.gzipKB)} > ${target.maxCssGzipKB}KB`,
          );
        }
      }

      if (totalGzipKB > target.maxTotalGzipKB) {
        violations.push(
          `  ❌ 总产出 ${formatKB(totalGzipKB)} > ${target.maxTotalGzipKB}KB（JS+CSS，gzip）`,
        );
      }

      const summary = `JS+CSS 合计 ${formatKB(totalGzipKB)} / 预算 ${target.maxTotalGzipKB}KB（gzip）`;
      if (violations.length === 0) {
        logger.info(`\n📦 Bundle Budget 通过（${target.name}）: ${summary}\n`);
        return;
      }

      logger.warn(`\n📦 Bundle Budget 校验失败（${target.name}）:`);
      logger.warn(violations.join('\n'));
      logger.warn(`\n  ${summary}\n`);

      if (failOnExceed) {
        this.error('Bundle budget exceeded — 见上方明细，请拆分 chunk 或收紧依赖。');
      }
    },
  };
}
