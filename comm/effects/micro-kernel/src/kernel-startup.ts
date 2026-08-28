/**
 * 内核启动逻辑 — start() 方法体
 *
 * 从 kernel.ts 提取的内核启动流程，包含预加载策略初始化、
 * Speculation Rules API 预加载增强、全局消息监听启动等。
 *
 * @path comm/effects/micro-kernel/src/kernel-startup.ts
 * @author ydsz-team
 * @since 4.2.1
 */

import type { MicroAppConfig, MicroAppEntry, StartOptions } from "@ydsz/micro-runtime";

import { createLogger } from "@YDSZ-core/shared/utils";

import { runWithConcurrency, scheduleIdle, shouldSkipPrefetchDueToNetwork } from "./kernel-helpers";
import { loadApp } from "./loader";
import { startMessageListener } from "./message-broker";
import type { PreloadManagerLike } from "./preload-manager-helpers";
import { setupPreloadMetricsReporting } from "./preload-metrics";
import {
  createRoutePreloadStrategy,
  type PreloadManager,
} from "./preload-strategy";
import { getRoutePredictor } from "./route-predictor-core";
import { setStyleIsolation, setupVisibilityAutoRelease } from "./scheduler";
import { applyPrefetchBoost } from "./speculation-rules";

/** 模块级日志器 */
const logger = createLogger("MicroKernel:Startup");

/**
 * 启动所需的状态访问器与依赖。
 */
export interface StartupContext {
  /** 获取已注册的应用列表 */
  getApps: () => MicroAppConfig[];
  /** 设置路由同步清理函数 */
  setRouterSyncCleanup: (cleanup: (() => void) | null) => void;
  /** 设置可见性清理函数 */
  setVisibilityCleanup: (cleanup: (() => void) | null) => void;
  /** 设置预加载指标上报清理函数（v4.4.0） */
  setMetricsCleanup: (cleanup: (() => void) | null) => void;
  /** 预加载管理器 */
  preloadManager: PreloadManager;
  /** 路由同步函数 */
  startRouterSync: (apps: MicroAppConfig[], options?: StartOptions) => () => void;
}

/**
 * 创建内核 start() 方法体。
 *
 * 启动流程：
 * 1. 设置权限检查器
 * 2. 启动路由监听
 * 3. 设置 CSS 作用域 + 可见性自动释放
 * 4. 启动全局消息监听
 * 5. Speculation Rules API 预加载增强
 * 6. 初始预加载（受网络条件感知控制）
 * 7. 注册 idle 预加载策略
 * 8. 注册路由预测预加载策略（v4.2.1 N9）
 *
 * @param ctx - 启动上下文
 * @returns start 函数
 */
export function createStartFunction(ctx: StartupContext) {
  return function start(options?: StartOptions): void {
    // P1-3.2: 设置权限检查器，预加载时会根据用户权限过滤
    if (options?.permissionChecker) {
      ctx.preloadManager.setPermissionChecker(options.permissionChecker);
    }

    // 启动路由监听（含 history 补丁）
    ctx.setRouterSyncCleanup(ctx.startRouterSync(ctx.getApps(), options));

    // v4.2.1 N5: 全局运行时 CSS 作用域兜底开关
    setStyleIsolation(options?.sandbox?.styleIsolation === true);

    // P0-P2: 页面切到后台时自动释放保活实例
    ctx.setVisibilityCleanup(setupVisibilityAutoRelease());

    // === v3.7.0: 启动全局消息监听（子应用点对点通信） ===
    startMessageListener((msg) => {
      logger.debug(`Message from ${msg.from} → ${msg.to}: ${msg.action}`);
    });

    // === v3.7.0: Speculation Rules API 预加载增强 ===
    if (options?.prefetchStrategy !== "never") {
      const appEntries: MicroAppEntry[] = ctx.getApps().map((a) => ({
        name: a.name,
        packageName: `@ydsz/${a.name}`,
        activeRule: typeof a.activeRule === "string" ? a.activeRule : `/${a.name}`,
        redirect: typeof a.activeRule === "string" ? `${a.activeRule}/` : `/${a.name}/`,
        title: a.name,
        icon: "lucide:box",
        order: 100,
        devPort: 5601,
        entry: a.entry,
        skeletonType: "default",
        sandbox: a.sandbox,
      }));
      const boostResult = applyPrefetchBoost(appEntries, options?.prefetchStrategy ?? "lazy");
      logger.debug(`Prefetch boost: ${boostResult}`);
    }

    // === S1 修复：预加载只拉取 ESM 模块与样式，不执行 mount ===
    const prefetchFilter = options?.prefetch;
    if (typeof prefetchFilter === "function") {
      const toPrefetch = ctx.getApps().filter((app) => prefetchFilter(app));
      if (shouldSkipPrefetchDueToNetwork()) {
        logger.debug("Prefetch skipped due to slow network or saveData");
      } else {
        scheduleIdle(() => {
          if (shouldSkipPrefetchDueToNetwork()) return;
          void runWithConcurrency(toPrefetch, 3, (app) =>
            loadApp(app).catch(() => { /* 预加载失败不阻塞 */ }),
          );
        });
      }
    }

    // === P2-10: 初始化预加载策略 ===
    const apps = ctx.getApps();
    for (const app of apps) {
      ctx.preloadManager.registerStrategy(app.name, {
        strategy: "idle",
        idleTimeout: 2000,
        onPreload: (appName: string) => {
          const config = apps.find((a) => a.name === appName);
          if (config) {
            void loadApp(config).catch(() => { /* 预加载失败不阻塞 */ });
          }
        },
      });
    }

    // === v4.2.1 N9: 内核内置路由预测预加载 ===
    if (options?.routePreload !== false) {
      try {
        ctx.preloadManager.registerStrategy(
          "__route_prediction__",
          createRoutePreloadStrategy(
            apps,
            undefined,
            (appName: string) => {
              const config = apps.find((a) => a.name === appName);
              if (config) {
                void loadApp(config).catch(() => { /* 预测预加载失败不阻塞 */ });
              }
            },
            { minProbability: 0.15, maxPreloads: 2, minSampleSize: 3 },
          ),
        );
        scheduleIdle(() => {
          if (shouldSkipPrefetchDueToNetwork()) return;
          void ctx.preloadManager.triggerPreload("__route_prediction__");
        });
        logger.debug("Route prediction preload strategy registered (kernel-builtin)");
      } catch (error) {
        logger.warn(`Route prediction strategy registration skipped: ${String(error)}`);
      }
    }

    // === v4.4.0: 预加载命中率指标回环 ===
    // 周期采样 preloadCount/consumedCount/hitRate 与马尔可夫转移样本量，
    // sendBeacon 上报后端，用于数据驱动验证/调整预测策略（v4.4 优化项 P1-9）
    if (options?.metricsReporting !== false) {
      try {
        // PreloadManager 私有字段为名义类型，内部辅助函数按 PreloadManagerLike 结构访问
        const pmLike = ctx.preloadManager as unknown as PreloadManagerLike;
        ctx.setMetricsCleanup(
          setupPreloadMetricsReporting(pmLike, {
            intervalMs: options?.metricsIntervalMs,
            getPredictor: () => {
              try {
                return getRoutePredictor();
              } catch {
                return undefined; // 路由预测器未初始化（routePreload=false）时静默
              }
            },
          }),
        );
      } catch (error) {
        logger.warn(`Preload metrics reporting setup skipped: ${String(error)}`);
      }
    }

    logger.info(`Started with ${apps.length} apps`);
    window.dispatchEvent(new CustomEvent("micro-kernel:started"));
  };
}
