/**
 * 预加载策略增强
 *
 * 提供多种预加载策略：
 * - idle 预加载：在浏览器空闲时预加载
 * - hover 预加载：鼠标悬停时预加载
 * - visibility 预加载：根据页面可见性预加载
 * - route 预加载：根据路由预测预加载（v4.0 P1-2: 接入 route-predictor 马尔可夫链预测）
 * - permission 预加载：基于用户权限动态调整预加载
 * - frequency 预加载：基于使用频率智能预加载
 *
 * 为控制单文件行数，以下内容已拆分为独立模块：
 * - preload-strategy-helpers.ts：策略工厂函数（createIdlePreloadStrategy / createHoverPreloadStrategy / createRoutePreloadStrategy / createFrequencyPreloadStrategy）
 * - preload-usage-stats.ts：应用使用统计存储（UsageStatsRecord）
 * - preload-types.ts：类型定义（AppUsageStats / PermissionChecker / PreloadStrategyOptions 等）
 * - network-utils.ts：网络工具函数（shouldPrefetchByStrategy）
 * - preload-manager-helpers.ts：PreloadManager 辅助函数（setupHoverListener / setupVisibilityListener / recordPreloadConsumedHelper / debugInfoHelper / 单例管理）
 *
 * 本文件保留 PreloadManager 核心类定义，并重新导出工厂函数与单例管理以保持向后兼容。
 *
 * @path comm/effects/micro-kernel/src/preload-strategy.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { DisposableManager } from "./manager-registry";
import type { PreloadManagerLike } from "./preload-manager-helpers";
import { createLogger } from "@YDSZ-core/shared/utils";

import { UsageStatsStore } from "./preload-usage-stats";

import type {
  PermissionChecker,
  PreloadStrategyOptions,
} from "./preload-types";

import {
  recordPreloadConsumedHelper,
  debugInfoHelper,
  destroyHelper,
  clearCacheHelper,
  hasPreloadedHelper,
  hasPermissionHelper,
  registerStrategyHelper,
  recordPreloadTriggerHelper,
  executePreloadHelper,
  __registerPreloadManager,
  createPreloadManagerLifecycle,
} from "./preload-manager-helpers";

type PM = PreloadManagerLike;

// 重新导出策略工厂函数，保持向后兼容
export {
  createFrequencyPreloadStrategy,
  createHoverPreloadStrategy,
  createIdlePreloadStrategy,
  createRoutePreloadStrategy,
  recordRouteTransition,
} from "./preload-strategy-helpers";

// 重新导出类型，保持向后兼容
export type {
  AppUsageStats,
  PermissionChecker,
  PrefetchStrategyConfig,
  PreloadStrategyOptions,
} from "./preload-types";
export type {
  PreloadPriority,
  PreloadStrategy,
  PrefetchStrategy,
} from "./preload-types";
export { shouldPrefetchByStrategy } from "./network-utils";

// 重新导出单例管理函数，保持向后兼容
export {
  getPreloadManager,
  resetPreloadManager,
} from "./preload-manager-helpers";

/** 模块级日志器 */
const logger = createLogger("PreloadManager");

/**
 * 预加载管理器
 */
export class PreloadManager {
  // 以下字段经 preload-manager-helpers 的 PreloadManagerLike 接口跨模块读写，
  // 故声明为公开字段（单例包内部协作约定，非对外 API 承诺）。
  strategies: Map<string, PreloadStrategyOptions> = new Map();
  preloadCache: Set<string> = new Set();
  hoverListeners: Map<string, () => void> = new Map();
  visibilityListener: (() => void) | null = null;
  permissionChecker: PermissionChecker | null = null;
  /** P1-2: 预加载命中率统计 */
  stats = {
    preloadCount: 0,
    consumedCount: 0,
    wastedCount: 0,
    preloadRecords: [] as Array<{
      appName: string;
      timestamp: number;
      consumed: boolean;
    }>,
  };
  usageStore: UsageStatsStore;

  constructor() {
    this.usageStore = new UsageStatsStore();
  }

  /**
   * 设置权限检查器
   *
   * @param checker - 权限检查函数，接收权限码数组返回布尔值
   */
  setPermissionChecker(checker: PermissionChecker | null): void {
    this.permissionChecker = checker;
  }

  /**
   * 记录应用访问（用于频率统计）
   *
   * @param appName - 应用名称
   */
  recordAppVisit(appName: string): void {
    this.usageStore.recordVisit(appName);
  }

  /**
   * 获取应用使用统计
   *
   * @param appName - 应用名称
   * @returns 应用使用统计，未记录时返回 null
   */
  getUsageStats(appName: string) {
    return this.usageStore.getStats(appName);
  }

  /**
   * 根据使用频率排序应用
   *
   * @returns 按访问频率降序排列的应用名称数组
   */
  getAppsByFrequency(): string[] {
    return this.usageStore.getByFrequency();
  }

  /**
   * P2-7: 获取所有应用使用统计（供 DevTools 面板可视化）。
   *
   * @returns 按访问频率降序排列的应用统计数组
   * @since 4.1.0
   */
  getAllUsageStats() {
    return this.usageStore.getAll();
  }

  /**
   * 检查应用是否有权限预加载
   *
   * @param appName - 应用名称
   * @returns 是否有权限
   */
  hasPermission(appName: string): boolean {
    return hasPermissionHelper(this as unknown as PM, appName);
  }

  /**
   * 注册预加载策略
   */
  registerStrategy(appName: string, options: PreloadStrategyOptions): void {
    registerStrategyHelper(this as unknown as PM, appName, options);
  }

  /**
   * 触发预加载
   */
  async triggerPreload(appName: string): Promise<void> {
    // 三道短路按开销从低到高排列：缓存查表 → 权限（可能打权限接口）→ 策略存在性。
    // 缓存命中必须先判，否则重复触发会重复拉资源，预加载反而变成带宽负担
    if (this.preloadCache.has(appName)) return;
    // 权限在真正拉资源前拦截：无权限的应用预加载成功也进不去，
    // 白白占用带宽与内存，还会在 DevTools 里留下误导性的 wastedCount
    if (!this.hasPermission(appName)) {
      logger.debug(`Skipped preload ${appName} due to permission check`);
      return;
    }
    const strategy = this.strategies.get(appName);
    if (!strategy?.onPreload) return;
    // 先记账再执行：即使 onPreload 抛错也已计入 preloadCount，
    // 这样统计口径反映「触发量」而非「成功量」，wastedCount 才能暴露真实的浪费率
    recordPreloadTriggerHelper(this as unknown as PM, appName);
    await executePreloadHelper(this as unknown as PM, appName, strategy);
  }

  /**
   * P1-2: 标记预加载缓存被实际消费。
   *
   * 当用户实际导航到已预加载的应用时由外部调用（kernel.switchToApp）。
   *
   * @param appName - 应用名称
   * @since 4.0.1
   */
  recordPreloadConsumed(appName: string): void {
    recordPreloadConsumedHelper(this as unknown as PM, appName);
  }

  /**
   * P1-2: 获取预加载统计信息 + 策略快照。
   *
   * @since 4.0.1
   */
  debugInfo(): {
    preloadCount: number;
    consumedCount: number;
    wastedCount: number;
    hitRate: number;
    preloadCache: string[];
    strategiesCount: number;
    usageStatsCount: number;
  } {
    return debugInfoHelper(this as unknown as PM);
  }

  /**
   * 清除预加载缓存
   */
  clearCache(appName?: string): void {
    clearCacheHelper(this as unknown as PM, appName);
  }

  /**
   * 检查应用是否已预加载。
   *
   * v3.4: 供 frequency 策略避免重复预加载
   */
  hasPreloaded(appName: string): boolean {
    return hasPreloadedHelper(this as unknown as PM, appName);
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    destroyHelper(this as unknown as PM);
    this.usageStore.clear();
    this.permissionChecker = null;
    this.stats.preloadCount = 0;
    this.stats.consumedCount = 0;
    this.stats.wastedCount = 0;
    this.stats.preloadRecords = [];
  }
}

// ==================== 单例注册 ====================

let preloadManagerInstance: PreloadManager | null = null;

// 注册单例工厂到 helpers 模块
__registerPreloadManager(
  () => {
    if (!preloadManagerInstance) {
      preloadManagerInstance = new PreloadManager();
    }
    return preloadManagerInstance;
  },
  () => {
    preloadManagerInstance?.destroy();
    preloadManagerInstance = null;
  },
);

/**
 * P0-A1: 创建 preload-strategy 生命周期管理器。
 *
 * 销毁预加载策略单例（含 MutationObserver / visibility 监听器），
 * 纳入 ManagerRegistry 统一释放。
 *
 * @since 4.1.0
 */
export function createPreloadManager(): DisposableManager {
  return createPreloadManagerLifecycle();
}
