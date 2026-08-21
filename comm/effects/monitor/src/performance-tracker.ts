/**
 * 运行时性能追踪器 — 采集子应用加载/挂载/通信的 Performance API 标记
 *
 * 设计目标：
 * - 为微前端运行时提供细粒度性能标记（mark）与测量（measure）
 * - 支持运行时开关控制，默认关闭避免影响生产性能
 * - 提供统一接口供 DevTools Panel 采集火焰图数据
 *
 * 采集数据可通过：
 * 1. `getFlameData()` → 火焰图可视化
 * 2. `getTimeline()` → 时间线视图
 * 3. `getMemoryTrend()` → 内存趋势（配合 performance.memory）
 *
 * 为控制单文件行数，以下内容已拆分为独立模块：
 * - performance-tracker-types.ts：类型定义（TimelineEntry / FlameNode / MemorySample）
 * - performance-tracker-flame.ts：火焰图数据生成（getFlameData）
 * - performance-tracker-memory.ts：内存采样（startMemorySampling / stopMemorySampling 等）
 * - performance-tracker-core.ts：核心追踪逻辑（trackApp* / trackKeepAlive* / trackPreload 等）
 *
 * 本文件保留公开 API 与重新导出，以保持向后兼容。
 *
 * @path comm/effects/monitor/src/performance-tracker.ts
 * @author ydsz-team
 * @since 4.0.0
 */

import type { TimelineEntry, FlameNode, MemorySample } from './performance-tracker-types';
import { getFlameData } from './performance-tracker-flame';
import {
  startMemorySampling,
  stopMemorySampling,
  getMemoryTrend,
  setKeepAliveCount,
  clearMemorySamples,
} from './performance-tracker-memory';

import {
  checkEnabled,
  setTrackingEnabledCore,
  trackAppLoadStart,
  trackAppLoadEnd,
  trackAppMountStart,
  trackAppMountEnd,
  trackAppUnmountStart,
  trackAppUnmountEnd,
  trackKeepAliveActivate,
  trackKeepAliveDeactivate,
  trackPreload,
  trackMessage,
  trackStateChange,
  trackRouteChange,
  getTimelineCore,
  clearTimelineCore,
  isTrackingCore,
  getStatsCore,
} from './performance-tracker-core';

// 向后兼容：重新导出类型和函数
export type { TimelineEntry, FlameNode, MemorySample } from './performance-tracker-types';
export { getFlameData } from './performance-tracker-flame';
export {
  startMemorySampling,
  stopMemorySampling,
  getMemoryTrend,
  setKeepAliveCount,
} from './performance-tracker-memory';

// 重新导出追踪函数
export {
  trackAppLoadStart,
  trackAppLoadEnd,
  trackAppMountStart,
  trackAppMountEnd,
  trackAppUnmountStart,
  trackAppUnmountEnd,
  trackKeepAliveActivate,
  trackKeepAliveDeactivate,
  trackPreload,
  trackMessage,
  trackStateChange,
  trackRouteChange,
} from './performance-tracker-core';

/**
 * 显式启用/禁用追踪
 */
export function setTrackingEnabled(enabled: boolean): void {
  setTrackingEnabledCore(enabled);
  if (enabled) {
    startMemorySampling();
  } else {
    stopMemorySampling();
  }
}

/** 获取时间线数据 */
export function getTimeline(): TimelineEntry[] {
  return getTimelineCore();
}

/** 清除历史数据 */
export function clearTimeline(): void {
  clearTimelineCore();
  clearMemorySamples();
}

/** 检查是否正在追踪 */
export function isTracking(): boolean {
  return isTrackingCore();
}

/** 获取追踪统计摘要 */
export function getStats(): {
  isTracking: boolean;
  timelineEntries: number;
  memorySamples: number;
  categories: Record<string, number>;
} {
  const stats = getStatsCore();
  return {
    ...stats,
    memorySamples: getMemoryTrend().length,
  };
}
