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
 * - performance-tracker-memory.ts：内存采样（startMemorySampling / sampleMemory 等）
 *
 * 本文件保留核心追踪逻辑与公开 API，并重新导出以保持向后兼容。
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

// 向后兼容：重新导出类型和函数
export type { TimelineEntry, FlameNode, MemorySample } from './performance-tracker-types';
export { getFlameData } from './performance-tracker-flame';
export {
  startMemorySampling,
  stopMemorySampling,
  getMemoryTrend,
  setKeepAliveCount,
} from './performance-tracker-memory';

/** 性能标记名称前缀 */
const MARK_PREFIX = 'YDSZ:';

/** 是否启用追踪（通过 URL 参数 ?debug_perf=1 或 localStorage 开关） */
let trackingEnabled = false;

/** 最大保留时间线条目数 */
const MAX_TIMELINE_ENTRIES = 1000;

/** 时间线数据 */
const timeline: TimelineEntry[] = [];

/**
 * 检查追踪是否启用
 *
 * 启用条件（满足任一）：
 * - URL 参数包含 `debug_perf=1`
 * - localStorage `ydsz_perf_tracking` = 'true'
 * - 开发环境
 */
function checkEnabled(): boolean {
  if (typeof window === 'undefined') return false;

  // 开发环境默认启用
  if (import.meta.env.DEV) return true;

  // 检查 URL 参数
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('debug_perf') === '1') return true;
  } catch {
    // 静默
  }

  // 检查 localStorage
  try {
    if (localStorage.getItem('ydsz_perf_tracking') === 'true') return true;
  } catch {
    // 静默
  }

  return trackingEnabled;
}

/**
 * 显式启用/禁用追踪
 */
export function setTrackingEnabled(enabled: boolean): void {
  trackingEnabled = enabled;
  if (enabled) {
    startMemorySampling();
  } else {
    stopMemorySampling();
  }
}

/**
 * 创建性能标记
 *
 * @internal 仅内部调用，自动检查启用状态
 */
function mark(name: string): void {
  if (!checkEnabled()) return;
  try {
    performance.mark(`${MARK_PREFIX}${name}`);
  } catch {
    // 静默
  }
}

/**
 * 创建性能测量
 */
function measure(name: string, startMark: string, endMark?: string): void {
  if (!checkEnabled()) return;
  try {
    performance.measure(
      `${MARK_PREFIX}${name}`,
      `${MARK_PREFIX}${startMark}`,
      endMark ? `${MARK_PREFIX}${endMark}` : undefined,
    );
  } catch {
    // 静默
  }
}

/**
 * 记录自定义时间线条目
 */
function recordTimeline(entry: TimelineEntry): void {
  timeline.push(entry);
  // 保持上限
  while (timeline.length > MAX_TIMELINE_ENTRIES) {
    timeline.shift();
  }
}

// ==================== 公开 API：子应用生命周期追踪 ====================

/**
 * 子应用加载开始
 */
export function trackAppLoadStart(appName: string): void {
  mark(`load_${appName}_start`);
}

/**
 * 子应用加载结束
 */
export function trackAppLoadEnd(appName: string, fromCache = false): void {
  mark(`load_${appName}_end`);
  measure(`load:${appName}`, `load_${appName}_start`, `load_${appName}_end`);

  if (checkEnabled()) {
    const startMark = `${MARK_PREFIX}load_${appName}_start`;
    const endMark = `${MARK_PREFIX}load_${appName}_end`;
    try {
      const measures = performance.getEntriesByName(`${MARK_PREFIX}load:${appName}`);
      const lastMeasure = measures[measures.length - 1];
      if (lastMeasure) {
        recordTimeline({
          name: `load:${appName}`,
          startTime: lastMeasure.startTime,
          duration: lastMeasure.duration,
          category: 'load',
          appName,
          timestamp: Date.now(),
        });
      }
    } catch {
      // 静默
    }
  }
}

/**
 * 子应用挂载开始
 */
export function trackAppMountStart(appName: string): void {
  mark(`mount_${appName}_start`);
}

/**
 * 子应用挂载结束
 */
export function trackAppMountEnd(appName: string): void {
  mark(`mount_${appName}_end`);
  measure(`mount:${appName}`, `mount_${appName}_start`, `mount_${appName}_end`);
}

/**
 * 子应用卸载开始
 */
export function trackAppUnmountStart(appName: string): void {
  mark(`unmount_${appName}_start`);
}

/**
 * 子应用卸载结束
 */
export function trackAppUnmountEnd(appName: string): void {
  mark(`unmount_${appName}_end`);
  measure(`unmount:${appName}`, `unmount_${appName}_start`, `unmount_${appName}_end`);
}

/**
 * Keep-alive 激活
 */
export function trackKeepAliveActivate(appName: string): void {
  mark(`activate_${appName}`);
  if (checkEnabled()) {
    recordTimeline({
      name: `activate:${appName}`,
      startTime: performance.now(),
      duration: 0,
      category: 'activate',
      appName,
      timestamp: Date.now(),
    });
  }
}

/**
 * Keep-alive 停用
 */
export function trackKeepAliveDeactivate(appName: string): void {
  mark(`deactivate_${appName}`);
  if (checkEnabled()) {
    recordTimeline({
      name: `deactivate:${appName}`,
      startTime: performance.now(),
      duration: 0,
      category: 'deactivate',
      appName,
      timestamp: Date.now(),
    });
  }
}

/**
 * 预加载触发
 */
export function trackPreload(appName: string, triggerType: string): void {
  if (checkEnabled()) {
    recordTimeline({
      name: `preload:${appName}(${triggerType})`,
      startTime: performance.now(),
      duration: 0,
      category: 'preload',
      appName,
      timestamp: Date.now(),
    });
  }
}

/**
 * 消息通信
 */
export function trackMessage(type: string, sourceApp: string, targetApp?: string): void {
  if (checkEnabled()) {
    recordTimeline({
      name: `message:${type}`,
      startTime: performance.now(),
      duration: 0,
      category: 'message',
      appName: sourceApp,
      timestamp: Date.now(),
    });
  }
}

/**
 * 全局状态变化
 */
export function trackStateChange(key: string, appName: string): void {
  if (checkEnabled()) {
    recordTimeline({
      name: `state:${key}`,
      startTime: performance.now(),
      duration: 0,
      category: 'state',
      appName,
      timestamp: Date.now(),
    });
  }
}

/**
 * 路由跳转
 */
export function trackRouteChange(to: string, appName: string): void {
  if (checkEnabled()) {
    recordTimeline({
      name: `route:${to}`,
      startTime: performance.now(),
      duration: 0,
      category: 'route',
      appName,
      timestamp: Date.now(),
    });
  }
}

// ==================== 数据查询 ====================

/**
 * 获取时间线数据
 */
export function getTimeline(): TimelineEntry[] {
  return [...timeline];
}

/**
 * 清除历史数据（用于测试或重新开始录制）
 */
export function clearTimeline(): void {
  timeline.length = 0;
  clearMemorySamples();
}

/**
 * 检查是否正在追踪
 */
export function isTracking(): boolean {
  return checkEnabled();
}

/**
 * 获取追踪统计摘要
 */
export function getStats(): {
  isTracking: boolean;
  timelineEntries: number;
  memorySamples: number;
  categories: Record<string, number>;
} {
  const categories: Record<string, number> = {};
  for (const entry of timeline) {
    categories[entry.category] = (categories[entry.category] || 0) + 1;
  }

  return {
    isTracking: checkEnabled(),
    timelineEntries: timeline.length,
    memorySamples: getMemoryTrend().length,
    categories,
  };
}
