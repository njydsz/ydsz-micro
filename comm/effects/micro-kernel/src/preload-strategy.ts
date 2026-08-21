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
 *
 * 本文件保留 PreloadManager 核心类与管理器生命周期管理，并重新导出工厂函数以保持向后兼容。
 *
 * @path comm/effects/micro-kernel/src/preload-strategy.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { createLogger } from "@YDSZ-core/shared/utils";

import { UsageStatsStore } from "./preload-usage-stats";

import type {
  PermissionChecker,
  PreloadStrategyOptions,
} from "./preload-types";
import { shouldPrefetchByStrategy } from "./network-utils";

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

/** 模块级日志器 */
const logger = createLogger("PreloadManager");

/**
 * 预加载管理器
 */
export class PreloadManager {
  private strategies: Map<string, PreloadStrategyOptions> = new Map();
  private preloadCache: Set<string> = new Set();
  private hoverListeners: Map<string, () => void> = new Map();
  private visibilityListener: (() => void) | null = null;
  private permissionChecker: PermissionChecker | null = null;
  /** P1-2: 预加载命中率统计 */
  private stats = {
    preloadCount: 0,
    consumedCount: 0,
    wastedCount: 0,
    preloadRecords: [] as Array<{
      appName: string;
      timestamp: number;
      consumed: boolean;
    }>;
  };
  private usageStore: UsageStatsStore;

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
    const strategy = this.strategies.get(appName);
    if (!strategy?.permissionCodes || strategy.permissionCodes.length === 0) {
      return true; // 无权限要求则默认允许
    }
    if (!this.permissionChecker) {
      return true; // 未设置权限检查器则默认允许
    }
    return this.permissionChecker(strategy.permissionCodes);
  }

  /**
   * 注册预加载策略
   */
  registerStrategy(appName: string, options: PreloadStrategyOptions): void {
    this.strategies.set(appName, options);

    // 根据策略类型设置监听器
    if (options.strategy === "hover") {
      this.setupHoverListener(appName, options);
    } else if (options.strategy === "visibility") {
      this.setupVisibilityListener();
    }
  }

  /**
   * 触发预加载
   */
  async triggerPreload(appName: string): Promise<void> {
    // 避免重复预加载
    if (this.preloadCache.has(appName)) {
      return;
    }

    // 权限检查：无权限则跳过
    if (!this.hasPermission(appName)) {
      logger.debug(`Skipped preload ${appName} due to permission check`);
      return;
    }

    const strategy = this.strategies.get(appName);
    if (!strategy?.onPreload) {
      return;
    }

    // P1-2: 记录预加载触发
    this.stats.preloadCount++;
    this.stats.preloadRecords.push({
      appName,
      timestamp: Date.now(),
      consumed: false,
    });
    // 限制 records 长度防止内存膨胀
    if (this.stats.preloadRecords.length > 200) {
      this.stats.preloadRecords.splice(0, 50);
    }

    try {
      this.preloadCache.add(appName);
      await strategy.onPreload(appName);
      logger.debug(`Preloaded ${appName} via ${strategy.strategy} strategy`);
    } catch (error) {
      logger.warn(`Failed to preload ${appName}:`, error);
      this.preloadCache.delete(appName);
      // 回滚对应的 record
      const rec = this.stats.preloadRecords.find(
        (r) => r.appName === appName && !r.consumed,
      );
      if (rec) rec.consumed = false;
    }
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
    if (this.preloadCache.has(appName)) {
      this.stats.consumedCount++;
      const rec = this.stats.preloadRecords.find(
        (r) => r.appName === appName && !r.consumed,
      );
      if (rec) rec.consumed = true;
    }
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
    // 计算未消费的预加载缓存数（视为潜在浪费）
    let wasted = 0;
    for (const rec of this.stats.preloadRecords) {
      if (!rec.consumed && Date.now() - rec.timestamp > 60_000) wasted++;
    }
    this.stats.wastedCount = wasted;
    const hitRate =
      this.stats.preloadCount > 0
        ? Math.round(
            (this.stats.consumedCount / this.stats.preloadCount) * 100,
          )
        : 0;
    return {
      preloadCount: this.stats.preloadCount,
      consumedCount: this.stats.consumedCount,
      wastedCount: wasted,
      hitRate,
      preloadCache: Array.from(this.preloadCache),
      strategiesCount: this.strategies.size,
      usageStatsCount: this.usageStore.stats.size,
    };
  }

  /**
   * 设置 hover 预加载监听器
   */
  private setupHoverListener(
    appName: string,
    _options: PreloadStrategyOptions,
  ): void {
    const listener = () => {
      void this.triggerPreload(appName);
    };

    // 查找所有可能触发该应用的元素
    const setupElementListeners = () => {
      const elements = document.querySelectorAll(
        `[data-preload-app="${appName}"]`,
      );
      elements.forEach((el) => {
        el.addEventListener("mouseenter", listener, { once: true });
      });
    };

    // 初始设置
    setupElementListeners();

    // === v4.0.1: MutationObserver 回调节流，防止高频 DOM 变化导致过度触发 ===
    let _throttleTimer: ReturnType<typeof setTimeout> | null = null;
    const THROTTLE_MS = 100;
    const throttledSetup = () => {
      if (_throttleTimer !== null) return;
      _throttleTimer = setTimeout(() => {
        _throttleTimer = null;
        setupElementListeners();
      }, THROTTLE_MS);
    };

    // 使用 MutationObserver 监听 DOM 变化（带节流）
    const observer = new MutationObserver(throttledSetup);

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    this.hoverListeners.set(appName, () => {
      if (_throttleTimer !== null) {
        clearTimeout(_throttleTimer);
        _throttleTimer = null;
      }
      observer.disconnect();
    });
  }

  /**
   * 设置可见性预加载监听器
   */
  private setupVisibilityListener(): void {
    if (this.visibilityListener) {
      return;
    }

    this.visibilityListener = () => {
      if (document.visibilityState === "visible") {
        // 页面可见时，预加载所有 visibility 策略的应用
        for (const [appName, strategy] of this.strategies) {
          if (strategy.strategy === "visibility") {
            void this.triggerPreload(appName);
          }
        }
      }
    };

    document.addEventListener("visibilitychange", this.visibilityListener);
  }

  /**
   * 清除预加载缓存
   */
  clearCache(appName?: string): void {
    if (appName) {
      this.preloadCache.delete(appName);
    } else {
      this.preloadCache.clear();
    }
  }

  /**
   * 检查应用是否已预加载。
   *
   * v3.4: 供 frequency 策略避免重复预加载
   */
  hasPreloaded(appName: string): boolean {
    return this.preloadCache.has(appName);
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    // 清理 hover 监听器
    for (const cleanup of this.hoverListeners.values()) {
      cleanup();
    }
    this.hoverListeners.clear();

    // 清理可见性监听器
    if (this.visibilityListener) {
      document.removeEventListener("visibilitychange", this.visibilityListener);
      this.visibilityListener = null;
    }

    this.strategies.clear();
    this.preloadCache.clear();
    this.usageStore.clear();
    this.permissionChecker = null;
    // P1-2: 清除统计
    this.stats.preloadCount = 0;
    this.stats.consumedCount = 0;
    this.stats.wastedCount = 0;
    this.stats.preloadRecords = [];
  }
}

/** 全局预加载管理器实例 */
let preloadManagerInstance: PreloadManager | null = null;

/**
 * 获取或创建预加载管理器实例
 */
export function getPreloadManager(): PreloadManager {
  if (!preloadManagerInstance) {
    preloadManagerInstance = new PreloadManager();
  }
  return preloadManagerInstance;
}

/**
 * 重置预加载管理器（用于测试）
 */
export function resetPreloadManager(): void {
  preloadManagerInstance?.destroy();
  preloadManagerInstance = null;
}

/**
 * P0-A1: 创建 preload-strategy 生命周期管理器。
 *
 * 销毁预加载策略单例（含 MutationObserver / visibility 监听器），
 * 纳入 ManagerRegistry 统一释放。
 *
 * @since 4.1.0
 */
export function createPreloadManager(): import("./manager-registry").DisposableManager {
  return {
    name: "preload-strategy",
    dispose(): void {
      preloadManagerInstance?.destroy();
      preloadManagerInstance = null;
    },
  };
}
