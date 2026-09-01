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
import type { ExtendedPerformance, MemoryInfo } from "./performance-memory";

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
  const mem = getJsHeapInfo();
  const limit = mem?.jsHeapSizeLimit;
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
 *
 * v4.3.0: 移除 (window as any)，统一走 getJsHeapInfo() 未知类型访问；
 * 非 Chromium（无 performance.memory）时回退到配置上限（纯计数 LRU）。
 */
function getAdaptiveMaxKeepAlive(): number {
  const base = getContext().maxKeepAliveApps;
  const mem = getJsHeapInfo();
  if (!mem) return base;
  const { jsHeapSizeLimit, usedJSHeapSize } = mem;
  if (!jsHeapSizeLimit || jsHeapSizeLimit <= 0 || !usedJSHeapSize) return base;
  const ratio = usedJSHeapSize / jsHeapSizeLimit;
  // 取 min(base, N) 而非直接返回 N：业务方可能把上限配成 0（不做数量限制）
  // 或 2（比 3 更严格），直接返回固定值会反过来放大配置，属于越权放宽
  if (ratio > 0.9) return Math.min(base, 1);
  if (ratio > 0.7) return Math.min(base, 3);
  return base;
}

/**
 * v4.4.1: 安全读取 performance.memory（非标准 Chromium API），使用预声明的 ExtendedPerformance 类型。
 *
 * 返回 null 表示环境不支持（Safari / Firefox / 未启用），调用方应退化为
 * 计数启发式（保活实例数量）而非静默跳过。
 *
 * v4.4.0 标注：该 API 已被 W3C 废弃，仅作为 performance.measureMemory()
 * 不可用时的同步回退路径保留，见 getMemoryUsageMB()。
 */
function getJsHeapInfo(): Partial<MemoryInfo> | null {
  try {
    const perf = (window as unknown as { performance?: ExtendedPerformance }).performance;
    const memory = perf?.memory;
    if (!memory) return null;
    return {
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usedJSHeapSize: memory.usedJSHeapSize,
    };
  } catch {
    return null;
  }
}

/**
 * v4.4.1: 获取当前 JS 堆占用（MB），优先标准 API。
 * 使用预声明的 ExtendedPerformance 类型替代内联 any 双重断言。
 *
 * 优先级：
 * 1. `performance.measureMemory()` —— W3C 标准提案，Chrome 128+ 可用，
 *    异步返回 { bytes }；每次调用有约几十毫秒开销，仅在内存压力判定时调用。
 * 2. `performance.memory.usedJSHeapSize` —— 已废弃的 Chromium 私有 API（同步）。
 * 3. 均不可用时返回 null，调用方退化为计数启发式。
 */
async function getMemoryUsageMB(): Promise<number | null> {
  // 标准路径：performance.measureMemory()（feature-detect，勿假设存在）
  const perf = (window as unknown as { performance?: ExtendedPerformance }).performance;
  const measure = perf?.measureMemory?.bind(window.performance);
  if (typeof measure === "function") {
    try {
      const result = await measure({ attribution: false });
      if (result && typeof result.bytes === "number") {
        return result.bytes / 1024 / 1024;
      }
    } catch {
      // 部分实现要求跨域隔离（crossOriginIsolated），失败时走回退
    }
  }

  // 回退路径：Chromium 私有 API（已废弃）
  const heap = getJsHeapInfo();
  return heap?.usedJSHeapSize ? heap.usedJSHeapSize / 1024 / 1024 : null;
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
    // popLruVictim 会把 victim 从 cached 中移除，因此 pinned 实例被跳过后
    // 也随之离开候选集。这正是期望行为：pin 的应用不参与淘汰，
    // 且不能因为「每次都选中它」而让 while 循环空转
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
  // O(n) 线性扫描而非维护有序结构：候选集就是已缓存的应用数，通常 ≤ maxKeepAliveApps
  // （默认 5），常数极小；用 Map/堆维护顺序反而增加状态与出错面，收益为负
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
 * v4.3.0 降级路径：非 Chromium（无 memory API）时退化为计数启发式 ——
 * 保活实例数超过自适应上限则触发淘汰，避免内存压力调度在 Safari/Firefox 下完全失效。
 *
 * v4.4.0：堆占用优先经 performance.measureMemory() 标准接口获取，
 * 已废弃的 performance.memory 仅作同步回退；两者均不可用时走计数启发式。
 *
 * @param thresholdMB - 内存阈值（MB），默认使用动态阈值
 */
export async function evictAllKeepAliveOnMemoryPressure(
  thresholdMB?: number,
): Promise<void> {
  const effectiveThreshold = thresholdMB ?? getDynamicMemoryThreshold();
  const measuredMB = await getMemoryUsageMB();

  if (measuredMB !== null) {
    // 堆占用路径：按 JS 堆内存判定（标准或回退 API）
    if (measuredMB < effectiveThreshold) return;
    logger.warn(
      `Memory pressure detected (${measuredMB.toFixed(0)}MB > ${effectiveThreshold.toFixed(0)}MB), evicting all keep-alive instances`,
    );
  } else {
    // 非 Chromium 降级路径：无 memory API，按保活实例数量判定
    const max = getAdaptiveMaxKeepAlive();
    let keepAliveCount = 0;
    for (const instance of getContext().appInstances.values()) {
      if (
        instance.keepAlive &&
        instance.status === "UNMOUNTED" &&
        instance.cachedRoot
      ) {
        keepAliveCount++;
      }
    }
    if (keepAliveCount <= max) return;
    logger.warn(
      `Memory API unavailable; count-based fallback (${keepAliveCount} keep-alive > ${max}), evicting idle instances`,
    );
  }

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
