/**
 * preload-metrics.ts — 预加载命中率指标回环
 *
 * 内部已维护 preloadCount / consumedCount / wastedCount / hitRate 统计
 * （debugInfoHelper），但仅停留在 DevTools 面板层面，无法回答
 * 「route/markov 预测策略是否真的比 frequency 更有效」。
 * 本模块按固定间隔（默认 120s）与页面卸载时采样一次快照，
 * 经 navigator.sendBeacon 上报后端，供周报对比各策略命中率。
 *
 * @path comm/effects/micro-kernel/src/preload-metrics.ts
 * @author ydsz-team
 * @since 4.4.0
 */

import { createLogger } from "@YDSZ-core/shared/utils";
import { debugInfoHelper, type PreloadManagerLike } from "./preload-manager-helpers";
import { getSummaryCore, type RoutePredictorLike } from "./route-predictor-core";

const logger = createLogger("MicroKernel");

/** 默认上报端点（可通过 setupPreloadMetricsReporting 覆盖） */
let reportEndpoint = "/api/v1/monitor/preload-metrics";

/** 预加载指标快照（与 debugInfoHelper 字段对齐） */
export interface PreloadMetricsSnapshot {
  /** 已触发预加载次数 */
  preloadCount: number;
  /** 预加载缓存被实际导航消费次数 */
  consumedCount: number;
  /** 超过 60s 未被消费的预加载次数（浪费） */
  wastedCount: number;
  /** 命中率（百分比，0-100） */
  hitRate: number;
  /** 路由转移总次数（马尔可夫链样本量） */
  routeTransitions: number;
  /** 唯一路由转移对数 */
  routeUniquePairs: number;
  /** 当前处于预加载缓存的应用 */
  preloadCache: string[];
  /** 采样时间戳 */
  timestamp: number;
}

/**
 * 覆盖上报端点（默认 `/api/v1/monitor/preload-metrics`）。
 *
 * @param endpoint - 上报端点 URL
 */
export function setPreloadMetricsEndpoint(endpoint: string): void {
  reportEndpoint = endpoint;
}

/**
 * 采集一次预加载指标快照。
 *
 * @param manager - PreloadManager 实例
 * @param predictor - RoutePredictor 实例（可空：未启用路由预测时）
 */
export function collectPreloadMetrics(
  manager: PreloadManagerLike,
  predictor?: RoutePredictorLike,
): PreloadMetricsSnapshot {
  const info = debugInfoHelper(manager);
  const summary = predictor ? getSummaryCore(predictor) : null;

  return {
    consumedCount: info.consumedCount,
    hitRate: info.hitRate,
    preloadCache: info.preloadCache,
    preloadCount: info.preloadCount,
    routeTransitions: summary?.totalTransitions ?? 0,
    routeUniquePairs: summary?.uniquePairs ?? 0,
    timestamp: Date.now(),
    wastedCount: info.wastedCount,
  };
}

/** 上报快照（sendBeacon 优先，降级 fetch keepalive；静默失败不阻塞内核） */
function reportSnapshot(snapshot: PreloadMetricsSnapshot): void {
  try {
    // @infra-fetch 基础设施层直用：内核指标上报（sendBeacon 降级通道），
    // 无统一请求客户端上下文（keepalive + 页面卸载窗口），云顶规范 §6.1 例外条款。
    const payload = JSON.stringify(snapshot);
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      if (navigator.sendBeacon(reportEndpoint, blob)) return;
    }
    void fetch(reportEndpoint, {
      body: payload,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      method: "POST",
    }).catch(() => {});
  } catch {
    // 指标上报失败不影响内核运行
  }
}

/**
 * 启动预加载指标周期上报。
 *
 * @param manager - PreloadManager 实例
 * @param options - 采样间隔（默认 120_000ms）与可选的路由预测器 getter
 * @returns 清理函数（卸载定时器与页面卸载监听）
 */
export function setupPreloadMetricsReporting(
  manager: PreloadManagerLike,
  options: {
    intervalMs?: number;
    getPredictor?: () => RoutePredictorLike | undefined;
  } = {},
): () => void {
  const intervalMs = options.intervalMs ?? 120_000;

  const sample = (): void => {
    let predictor: RoutePredictorLike | undefined;
    try {
      predictor = options.getPredictor?.();
    } catch {
      predictor = undefined; // 路由预测器未初始化时静默
    }
    reportSnapshot(collectPreloadMetrics(manager, predictor));
  };

  const timer = setInterval(() => {
    // 页面隐藏时无需上报，等待回到前台；pagehide 兜底最终快照
    if (!document.hidden) sample();
  }, intervalMs);

  const onPageHide = (): void => {
    sample();
  };
  window.addEventListener("pagehide", onPageHide, { once: false });

  logger.debug(`Preload metrics reporting started (interval=${intervalMs}ms)`);

  return () => {
    clearInterval(timer);
    window.removeEventListener("pagehide", onPageHide);
  };
}
