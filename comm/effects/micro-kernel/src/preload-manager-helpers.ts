/**
 * preload-manager-helpers.ts — PreloadManager 辅助函数
 *
 * 从 preload-strategy.ts 提取的辅助函数，包含：
 * - setupHoverListener: hover 预加载监听器设置
 * - setupVisibilityListener: 可见性预加载监听器设置
 * - recordPreloadConsumedHelper: 标记预加载缓存被实际消费
 * - debugInfoHelper: 获取预加载统计信息 + 策略快照
 * - getPreloadManager / resetPreloadManager / createPreloadManager: 单例管理
 *
 * @path comm/effects/micro-kernel/src/preload-manager-helpers.ts
 * @author ydsz-team
 * @since 4.1.0
 */

import { createLogger } from "@YDSZ-core/shared/utils";

import type { PreloadStrategyOptions } from "./preload-types";

/** 模块级日志器 */
const logger = createLogger("PreloadManager");

/**
 * PreloadManager 内部状态接口（用于辅助函数访问）
 */
export interface PreloadManagerLike {
  preloadCache: Set<string>;
  hoverListeners: Map<string, () => void>;
  visibilityListener: (() => void) | null;
  strategies: Map<string, PreloadStrategyOptions>;
  triggerPreload(appName: string): Promise<void>;
  stats: {
    preloadCount: number;
    consumedCount: number;
    wastedCount: number;
    preloadRecords: Array<{
      appName: string;
      timestamp: number;
      consumed: boolean;
    }>;
  };
  usageStore: {
    stats: Map<string, unknown>;
  };
}

/**
 * 设置 hover 预加载监听器
 *
 * @param manager - PreloadManager 实例
 * @param appName - 应用名称
 * @param _options - 预加载策略选项
 */
export function setupHoverListener(
  manager: PreloadManagerLike,
  appName: string,
  _options: PreloadStrategyOptions,
): void {
  const listener = () => {
    void manager.triggerPreload(appName);
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

  manager.hoverListeners.set(appName, () => {
    if (_throttleTimer !== null) {
      clearTimeout(_throttleTimer);
      _throttleTimer = null;
    }
    observer.disconnect();
  });
}

/**
 * 设置可见性预加载监听器
 *
 * @param manager - PreloadManager 实例
 */
export function setupVisibilityListener(manager: PreloadManagerLike): void {
  if (manager.visibilityListener) {
    return;
  }

  manager.visibilityListener = () => {
    if (document.visibilityState === "visible") {
      // 页面可见时，预加载所有 visibility 策略的应用
      for (const [appName, strategy] of manager.strategies) {
        if (strategy.strategy === "visibility") {
          void manager.triggerPreload(appName);
        }
      }
    }
  };

  document.addEventListener("visibilitychange", manager.visibilityListener);
}

/**
 * 标记预加载缓存被实际消费。
 *
 * 当用户实际导航到已预加载的应用时由外部调用（kernel.switchToApp）。
 *
 * @param manager - PreloadManager 实例
 * @param appName - 应用名称
 * @since 4.0.1
 */
export function recordPreloadConsumedHelper(
  manager: PreloadManagerLike,
  appName: string,
): void {
  if (manager.preloadCache.has(appName)) {
    manager.stats.consumedCount++;
    const rec = manager.stats.preloadRecords.find(
      (r) => r.appName === appName && !r.consumed,
    );
    if (rec) rec.consumed = true;
  }
}

/**
 * 获取预加载统计信息 + 策略快照。
 *
 * @param manager - PreloadManager 实例
 * @since 4.0.1
 */
export function debugInfoHelper(
  manager: PreloadManagerLike,
): {
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
  for (const rec of manager.stats.preloadRecords) {
    if (!rec.consumed && Date.now() - rec.timestamp > 60_000) wasted++;
  }
  manager.stats.wastedCount = wasted;
  const hitRate =
    manager.stats.preloadCount > 0
      ? Math.round(
          (manager.stats.consumedCount / manager.stats.preloadCount) * 100,
        )
      : 0;
  return {
    preloadCount: manager.stats.preloadCount,
    consumedCount: manager.stats.consumedCount,
    wastedCount: wasted,
    hitRate,
    preloadCache: Array.from(manager.preloadCache),
    strategiesCount: manager.strategies.size,
    usageStatsCount: manager.usageStore.stats.size,
  };
}

// ==================== 实例方法辅助函数 ====================

/**
 * 销毁管理器辅助函数
 *
 * @param manager - PreloadManager 实例
 */
export function destroyHelper(manager: PreloadManagerLike): void {
  // 清理 hover 监听器
  for (const cleanup of manager.hoverListeners.values()) {
    cleanup();
  }
  manager.hoverListeners.clear();

  // 清理可见性监听器
  if (manager.visibilityListener) {
    document.removeEventListener("visibilitychange", manager.visibilityListener);
    manager.visibilityListener = null;
  }

  manager.strategies.clear();
  manager.preloadCache.clear();
  // 注意：usageStore 的清理需要单独处理
  // permissionChecker 需要单独清理
  // stats 需要单独清理
}

/**
 * 清除预加载缓存辅助函数
 *
 * @param manager - PreloadManager 实例
 * @param appName - 应用名称（可选）
 */
export function clearCacheHelper(manager: PreloadManagerLike, appName?: string): void {
  if (appName) {
    manager.preloadCache.delete(appName);
  } else {
    manager.preloadCache.clear();
  }
}

/**
 * 检查应用是否已预加载辅助函数
 *
 * @param manager - PreloadManager 实例
 * @param appName - 应用名称
 * @returns 是否已预加载
 */
export function hasPreloadedHelper(manager: PreloadManagerLike, appName: string): boolean {
  return manager.preloadCache.has(appName);
}

/**
 * 检查应用是否有权限预加载辅助函数
 *
 * @param manager - PreloadManager 实例
 * @param appName - 应用名称
 * @returns 是否有权限
 */
export function hasPermissionHelper(manager: PreloadManagerLike, appName: string): boolean {
  const strategy = manager.strategies.get(appName);
  if (!strategy?.permissionCodes || strategy.permissionCodes.length === 0) {
    return true;
  }
  if (!manager.permissionChecker) {
    return true;
  }
  return manager.permissionChecker(strategy.permissionCodes);
}

/**
 * 注册预加载策略辅助函数
 *
 * @param manager - PreloadManager 实例
 * @param appName - 应用名称
 * @param options - 预加载策略选项
 */
export function registerStrategyHelper(
  manager: PreloadManagerLike,
  appName: string,
  options: PreloadStrategyOptions,
): void {
  manager.strategies.set(appName, options);
  if (options.strategy === "hover") {
    setupHoverListener(manager, appName, options);
  } else if (options.strategy === "visibility") {
    setupVisibilityListener(manager);
  }
}

/**
 * 记录预加载触发（stats 更新）
 *
 * @param manager - PreloadManager 实例
 * @param appName - 应用名称
 */
export function recordPreloadTriggerHelper(
  manager: PreloadManagerLike,
  appName: string,
): void {
  manager.stats.preloadCount++;
  manager.stats.preloadRecords.push({
    appName,
    timestamp: Date.now(),
    consumed: false,
  });
  if (manager.stats.preloadRecords.length > 200) {
    manager.stats.preloadRecords.splice(0, 50);
  }
}

/**
 * 执行预加载（try/catch 包装）
 *
 * @param manager - PreloadManager 实例
 * @param appName - 应用名称
 * @param strategy - 预加载策略选项
 */
export async function executePreloadHelper(
  manager: PreloadManagerLike,
  appName: string,
  strategy: PreloadStrategyOptions,
): Promise<void> {
  try {
    manager.preloadCache.add(appName);
    await strategy.onPreload(appName);
    logger.debug(`Preloaded ${appName} via ${strategy.strategy} strategy`);
  } catch (error) {
    logger.warn(`Failed to preload ${appName}:`, error);
    manager.preloadCache.delete(appName);
    const rec = manager.stats.preloadRecords.find(
      (r) => r.appName === appName && !r.consumed,
    );
    if (rec) rec.consumed = false;
  }
}

// ==================== 单例管理（通过注册模式避免循环依赖） ====================

type PreloadManagerInterface = import("./preload-strategy").PreloadManager;

/** 单例获取函数（由 preload-strategy.ts 注册） */
let instanceGetter: (() => PreloadManagerInterface) | null = null;
/** 单例销毁函数（由 preload-strategy.ts 注册） */
let instanceDestroyer: (() => void) | null = null;

/**
 * 注册 PreloadManager 单例工厂（由 preload-strategy.ts 调用）
 */
export function __registerPreloadManager(
  getter: () => PreloadManagerInterface,
  destroyer: () => void,
): void {
  instanceGetter = getter;
  instanceDestroyer = destroyer;
}

/**
 * 获取或创建预加载管理器实例
 */
export function getPreloadManager(): PreloadManagerInterface {
  if (!instanceGetter) {
    throw new Error(
      "PreloadManager not initialized. Ensure preload-strategy.ts is imported.",
    );
  }
  return instanceGetter();
}

/**
 * 重置预加载管理器（用于测试）
 */
export function resetPreloadManager(): void {
  instanceDestroyer?.();
}

/**
 * P0-A1: 创建 preload-strategy 生命周期管理器。
 *
 * 销毁预加载策略单例（含 MutationObserver / visibility 监听器），
 * 纳入 ManagerRegistry 统一释放。
 *
 * @since 4.1.0
 */
export function createPreloadManagerLifecycle(): import("./manager-registry").DisposableManager {
  return {
    name: "preload-strategy",
    dispose(): void {
      instanceDestroyer?.();
    },
  };
}
