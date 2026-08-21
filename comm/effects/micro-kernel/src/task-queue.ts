/**
 * 任务调度队列与优先级管理模块
 *
 * LRU 淘汰 (v4.2.1 L3 线性扫描)、TTL 过期检测、内存压力感知的自动释放
 * (v4.2.1 L4 自适应保活上限)、visibilitychange 自动释放。
 *
 * @path comm/effects/micro-kernel/src/task-queue.ts
 * @author ydsz-team
 * @since 3.6.1
 */

import type { AppInstance, SchedulerContext } from "./app-state";
import { getContext } from "./app-state";
import { createLogger } from "@YDSZ-core/shared/utils";
import { removeStylesheets } from "./loader";

/** 模块级日志器（任务调度队列） */
const logger = createLogger("MicroKernel:TaskQueue");

// ==================== P0-P2: before-evict 事件 ====================

/** 派发 before-evict 事件，返回 true 表示允许淘汰，false 表示被阻止 */
function dispatchBeforeEvict(appName: string): boolean {
  const event = new CustomEvent("micro-kernel:before-evict", {
    detail: { appName },
    cancelable: true,
    bubbles: true,
  });
  return window.dispatchEvent(event);
}

// ==================== 内存压力工具函数 ====================

/** 获取动态内存阈值：堆大小限制的 80%，不可用时回退到 defaultMB（默认 500MB） */
function getDynamicMemoryThreshold(defaultMB = 500): number {
  const perf = (
    window as unknown as {
      performance?: {
        memory?: {
          jsHeapSizeLimit?: number;
          usedJSHeapSize?: number;
        };
      };
    }
  ).performance;
  const limit = perf?.memory?.jsHeapSizeLimit;
  if (limit && limit > 0) {
    return (limit / 1024 / 1024) * 0.8;
  }
  return defaultMB;
}

// ==================== v4.2.1 L4: 自适应 KeepAlive 上限 ====================

/**
 * 计算自适应 KeepAlive 上限（基于 JS 堆占用）：
 * - 堆占用 > 90%：上限降至 1
 * - 堆占用 > 70%：上限降至 3
 * - 其余：保持配置值
 */
function getAdaptiveMaxKeepAlive(): number {
  const base = getContext().maxKeepAliveApps;
  const mem = (window as any)?.performance?.memory;
  if (!mem || mem.jsHeapSizeLimit <= 0) return base;
  const ratio = mem.usedJSHeapSize / mem.jsHeapSizeLimit;
  if (ratio > 0.9) return Math.min(base, 1);
  if (ratio > 0.7) return Math.min(base, 3);
  return base;
}

// ==================== LRU 淘汰核心逻辑 ====================

/**
 * LRU 淘汰 (v4.2.1 L3/L4)：超限时按 lastActivatedAt 升序卸载最久未访问的保活实例。
 * TTL 过期 (v3.7.0) 时强制淘汰 (pinned 跳过)；淘汰前派发 before-evict 事件 (cancelable)。
 * @returns 被淘汰的应用名列表
 */
export async function evictKeepAliveIfNeeded(
  ctx: SchedulerContext = getContext(),
): Promise<string[]> {
  const effectiveMax = getAdaptiveMaxKeepAlive();
  if (effectiveMax <= 0) return [];

  const cached: AppInstance[] = [];
  const now = ctx.keepAliveTimestamp;
  for (const instance of ctx.appInstances.values()) {
    if (
      instance.keepAlive &&
      instance.status === "UNMOUNTED" &&
      instance.cachedRoot
    ) {
      cached.push(instance);
    }
  }

  const evicted: string[] = [];

  // v3.7.0: TTL 过期淘汰 — pinned 实例不参与
  if (ctx.keepAliveTTL > 0) {
    for (const instance of cached) {
      if (instance.pinned) continue;
      const age = now - instance.keepAliveSince;
      if (age > ctx.keepAliveTTL) {
        if (!dispatchBeforeEvict(instance.config.name)) continue;
        await evictSingleInstance(instance);
        evicted.push(instance.config.name);
      }
    }
    // 淘汰完后重新收集剩余缓存
    cached.splice(
      0,
      cached.length,
      ...[...ctx.appInstances.values()].filter(
        (i) =>
          i.keepAlive &&
          i.status === "UNMOUNTED" &&
          i.cachedRoot &&
          !evicted.includes(i.config.name),
      ),
    );
  }

  // LRU 淘汰
  while (cached.length > effectiveMax) {
    const victim = popLruVictim(cached);
    if (victim.pinned) continue;
    if (!dispatchBeforeEvict(victim.config.name)) {
      logger.debug(
        `LRU eviction of "${victim.config.name}" prevented by before-evict listener`,
      );
      continue;
    }
    logger.debug(
      `LRU evicting keep-alive app "${victim.config.name}" (cached=${cached.length + 1}, max=${effectiveMax})`,
    );
    await evictSingleInstance(victim);
    evicted.push(victim.config.name);
  }

  return evicted;
}

// ==================== LRU 辅助 ====================

/** 从缓存实例数组中弹出最久未访问的实例 (v4.2.1 L3 线性扫描) */
function popLruVictim(cached: AppInstance[]): AppInstance {
  let minIdx = 0;
  let minTime = cached[0]?.lastActivatedAt ?? 0;
  for (let i = 1; i < cached.length; i++) {
    const time = cached[i]?.lastActivatedAt ?? 0;
    if (time < minTime) {
      minIdx = i;
      minTime = time;
    }
  }
  return cached.splice(minIdx, 1)[0]!;
}

// ==================== 单实例淘汰 ====================

/**
 * 完整卸载单个保活实例（共享逻辑）。
 * P1-2: DOM 清理兜底 — unmount 失败时仍清理容器 DOM。
 * v4.1 P0-A2: 使用 strategy.cleanup() 清理沙箱。
 */
async function evictSingleInstance(instance: AppInstance): Promise<void> {
  instance.keepAlive = false;
  let unmountSuccess = true;
  try {
    if (instance.exports) {
      await instance.exports.unmount({
        container:
          (instance.cachedParent as HTMLElement) ||
          document.createElement("div"),
        basename:
          typeof instance.config.activeRule === "string"
            ? instance.config.activeRule
            : "/",
      });
    }
  } catch (error) {
    unmountSuccess = false;
    logger.error(`Evict unmount failed for "${instance.config.name}":`, error);
  }

  // P1-2: DOM 清理兜底
  if (!unmountSuccess && instance.cachedParent) {
    const container = instance.cachedParent as HTMLElement;
    try {
      while (container.firstChild) {
        container.firstChild.remove();
      }
    } catch {
      // DOM 操作失败不影响后续清理
    }
  }

  instance.strategy?.cleanup();
  instance.strategy = null;
  removeStylesheets(instance.config.name);
  instance.cachedRoot = null;
  instance.cachedParent = null;
  instance.exports = null;
  instance.status = "NOT_LOADED";
  instance.error = null;
  instance.keepAliveSince = 0;
  logger.debug(`Evicted keep-alive app "${instance.config.name}"`);
}

// ==================== 内存压力释放 ====================

/**
 * 内存压力下强制卸载所有非活跃保活实例（使用动态阈值，默认 jsHeapSizeLimit 的 80%）。
 * 淘汰前派发 before-evict 事件（v4.1 P0-A2: strategy.cleanup() 清理沙箱）。
 *
 * @param thresholdMB - 内存阈值（MB），默认使用动态阈值
 */
export async function evictAllKeepAliveOnMemoryPressure(
  thresholdMB?: number,
): Promise<void> {
  const effectiveThreshold = thresholdMB ?? getDynamicMemoryThreshold();
  const performance = (
    window as unknown as {
      performance?: { memory?: { usedJSHeapSize: number } };
    }
  ).performance;
  const usedMB = performance?.memory
    ? performance.memory.usedJSHeapSize / 1024 / 1024
    : 0;

  if (usedMB < effectiveThreshold) return;

  logger.warn(
    `Memory pressure detected (${usedMB.toFixed(0)}MB > ${effectiveThreshold.toFixed(0)}MB), evicting all keep-alive instances`,
  );

  for (const instance of getContext().appInstances.values()) {
    if (
      instance.keepAlive &&
      instance.status === "UNMOUNTED" &&
      instance.cachedRoot
    ) {
      if (!dispatchBeforeEvict(instance.config.name)) {
        logger.debug(
          `Memory pressure eviction of "${instance.config.name}" prevented by before-evict listener`,
        );
        continue;
      }

      instance.keepAlive = false;
      try {
        if (instance.exports) await instance.exports.unmount({
          container: (instance.cachedParent as HTMLElement) || document.createElement("div"),
          basename: typeof instance.config.activeRule === "string" ? instance.config.activeRule : "/",
        });
      } catch { /* 静默 */ }
      instance.strategy?.cleanup();
      instance.strategy = null;
      removeStylesheets(instance.config.name);
      instance.cachedRoot = null;
      instance.cachedParent = null;
      instance.exports = null;
      instance.status = "NOT_LOADED";
    }
  }
}

// ==================== visibilitychange 自动释放 ====================

/** 页面切换到后台时触发内存压力检查，自动释放非活跃保活实例 */
export function setupVisibilityAutoRelease(): () => void {
  if (typeof document === "undefined") return () => {};

  const handler = (): void => {
    if (document.hidden) {
      void evictAllKeepAliveOnMemoryPressure();
    }
  };
  document.addEventListener("visibilitychange", handler);
  return () => {
    document.removeEventListener("visibilitychange", handler);
  };
}
