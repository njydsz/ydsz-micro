/**
 * 预加载策略工厂函数
 *
 * 提供多种预加载策略的工厂创建函数：
 * - createIdlePreloadStrategy：idle 预加载
 * - createHoverPreloadStrategy：hover 预加载
 * - createRoutePreloadStrategy：路由预测预加载
 * - createFrequencyPreloadStrategy：基于使用频率的预加载
 *
 * 从 preload-strategy.ts 提取，保持向后兼容。
 *
 * @path comm/effects/micro-kernel/src/preload-strategy-helpers.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { MicroAppConfig } from "@ydsz/micro-runtime";
import { createLogger } from "@YDSZ-core/shared/utils";

import { getRoutePredictor, type Prediction } from "./route-predictor";

import type { PreloadStrategyOptions } from "./preload-types";

const logger = createLogger("PreloadManager");

/**
 * 创建 idle 预加载策略
 */
export function createIdlePreloadStrategy(
  apps: MicroAppConfig[],
  onPreload: (appName: string) => void | Promise<void>,
  idleTimeout = 2000,
): PreloadStrategyOptions[] {
  return apps.map((app) => ({
    strategy: "idle" as const,
    idleTimeout,
    onPreload: () => {
      // 使用 requestIdleCallback 在空闲时执行
      if ("requestIdleCallback" in window) {
        return new Promise<void>((resolve) => {
          window.requestIdleCallback(
            () => {
              void Promise.resolve(onPreload(app.name)).then(resolve);
            },
            { timeout: idleTimeout },
          );
        });
      } else {
        // 降级到 setTimeout
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            void Promise.resolve(onPreload(app.name)).then(resolve);
          }, idleTimeout);
        });
      }
    },
  }));
}

/**
 * 创建 hover 预加载策略
 */
export function createHoverPreloadStrategy(
  apps: MicroAppConfig[],
  onPreload: (appName: string) => void | Promise<void>,
): PreloadStrategyOptions[] {
  return apps.map((app) => ({
    strategy: "hover" as const,
    onPreload: () => onPreload(app.name),
  }));
}

/**
 * 创建路由预测预加载策略（v4.0 P1-2 增强）。
 *
 * 两种使用方式：
 * 1. 自动模式（推荐）：不传 `getRoutePredictions`，内部使用全局 RoutePredictor 单例，
 *    基于用户历史跳转的马尔可夫链概率预测下一步应用。
 * 2. 自定义模式：传入 `getRoutePredictions` 回调，按自定义逻辑返回预测路径。
 *
 * 仅在转移概率 ≥ minProbability（默认 0.15）且样本量 ≥ minSampleSize（默认 3）时
 * 才触发预加载，避免低频误判与小样本高估浪费带宽。
 */
export function createRoutePreloadStrategy(
  apps: MicroAppConfig[],
  getRoutePredictions?: () => string[],
  onPreload?: (appName: string) => void | Promise<void>,
  options: {
    /** 最低转移概率阈值（0~1），默认 0.15 */
    minProbability?: number;
    /** 单源最大预加载数量，默认 2 */
    maxPreloads?: number;
    /**
     * 最低转移样本量门槛（v4.4.0），默认 3。
     *
     * 马尔可夫链在样本量极小时会高估概率（1 次转移即 p=1.0），
     * 低于该门槛的预测一律跳过 —— 冷启动阶段自然回退到
     * 已注册的 idle / frequency 基线策略，避免"为预测而预测"。
     * 结合 preload-metrics 周报数据可按需调高门槛或关闭 routePreload。
     */
    minSampleSize?: number;
  } = {},
): PreloadStrategyOptions {
  const { minProbability = 0.15, maxPreloads = 2, minSampleSize = 3 } = options;

  // 内部预加载回调，去重并标记已预加载
  const preloadedApps = new Set<string>();
  const doPreload = async (appName: string) => {
    if (preloadedApps.has(appName)) return;
    preloadedApps.add(appName);
    if (onPreload) {
      try {
        await onPreload(appName);
      } catch (err) {
        // 回滚标记，允许重试
        preloadedApps.delete(appName);
        throw err;
      }
    }
  };

  return {
    strategy: "route" as const,
    onPreload: async () => {
      // 1. 自定义模式：使用传入的预测回调
      if (getRoutePredictions) {
        const predictions = getRoutePredictions();
        for (const route of predictions) {
          const app = apps.find(
            (a) => a.activeRule && route.startsWith(a.activeRule),
          );
          if (app) {
            await doPreload(app.name);
          }
        }
        return;
      }

      // 2. 自动模式：从 RoutePredictor 获取当前应用的预测
      const predictor = getRoutePredictor();
      const knownApps = predictor.getKnownApps();

      // 对每个已知来源应用，获取 top predictions 并预加载
      let preloadCount = 0;
      for (const fromApp of knownApps) {
        if (preloadCount >= maxPreloads) break;

        const predictions: Prediction[] = predictor.predict(
          fromApp,
          maxPreloads,
        );
        for (const pred of predictions) {
          if (preloadCount >= maxPreloads) break;
          if (pred.probability < minProbability) continue;
          // v4.4.0: 小样本高估防护 —— 样本量不足时跳过，回退基线策略
          if ((pred.sampleSize ?? 0) < minSampleSize) continue;

          const app = apps.find((a) => a.name === pred.appName);
          if (app) {
            await doPreload(app.name);
            preloadCount++;
            logger.debug(
              `Route preload: ${fromApp} → ${pred.appName} (p=${pred.probability.toFixed(2)}, n=${pred.sampleSize})`,
            );
          }
        }
      }
    },
  };
}

/**
 * 记录一次路由跳转供预测模型学习。
 *
 * 由 kernel.ts 在 switchToApp 成功后调用。
 *
 * @param fromApp - 来源应用名（可为空表示主应用入口）
 * @param toApp - 目标应用名
 */
export function recordRouteTransition(
  fromApp: string | undefined | null,
  toApp: string,
): void {
  if (!fromApp || fromApp === toApp) return;
  try {
    getRoutePredictor().recordTransition(fromApp, toApp);
  } catch {
    // 预测器不可用时静默
  }
}

/**
 * 创建基于使用频率的预加载策略。
 *
 * v3.4: 从 PreloadManager 已记录的 usageStats 中取访问频率最高的 N 个应用，
 * 在 idle 时按优先级预加载。频率数据由 kernel.ts 在每次 activateApp 成功后
 * 调用 `preloadManager.recordAppVisit()` 自动累积。
 *
 * 无历史数据时（首次访问）回退为空列表，不预加载任何应用。
 *
 * @param topN 预加载前 N 个高频应用，默认 3
 * @param onPreload 预加载回调
 * @returns 预加载策略配置
 */
export function createFrequencyPreloadStrategy(
  topN = 3,
  onPreload: (appName: string) => void | Promise<void>,
): PreloadStrategyOptions {
  return {
    strategy: "frequency" as const,
    priority: "medium" as const,
    onPreload: async () => {
      // 延迟导入避免循环依赖
      const { getPreloadManager } = await import("./preload-strategy");
      const manager = getPreloadManager();
      const ranked = manager.getAppsByFrequency();
      const candidates = ranked.slice(0, topN);
      for (const appName of candidates) {
        // 仅预加载尚未缓存的应用
        if (!manager.hasPreloaded(appName)) {
          await onPreload(appName);
        }
      }
    },
  };
}
