/**
 * performance-tracker-core.ts — 性能追踪核心逻辑
 *
 * 从 performance-tracker.ts 提取的追踪函数，包含：
 * - 子应用生命周期追踪（trackAppLoadStart/End / trackAppMountStart/End / trackAppUnmountStart/End）
 * - Keep-alive 追踪（trackKeepAliveActivate/Deactivate）
 * - 预加载/消息/状态/路由追踪
 * - 内部工具函数（checkEnabled / mark / measure / recordTimeline）
 *
 * @path comm/effects/monitor/src/performance-tracker-core.ts
 * @author ydsz-team
 * @since 4.1.0
 */

import type { TimelineEntry } from './performance-tracker-types';

/** 性能标记名称前缀 */
const MARK_PREFIX = 'YDSZ:';

/** 是否启用追踪 */
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
export function checkEnabled(): boolean {
  if (typeof window === 'undefined') return false;

  if (import.meta.env.DEV) return true;

  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('debug_perf') === '1') return true;
  } catch {
    // 静默
  }

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
export function setTrackingEnabledCore(enabled: boolean): void {
  trackingEnabled = enabled;
  if (enabled) {
    import('./performance-tracker-memory').then(({ startMemorySampling }) => {
      startMemorySampling();
    });
  } else {
    import('./performance-tracker-memory').then(({ stopMemorySampling }) => {
      stopMemorySampling();
    });
  }
}

/**
 * 创建性能标记
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
  while (timeline.length > MAX_TIMELINE_ENTRIES) {
    timeline.shift();
  }
}

// ==================== 公开 API：子应用生命周期追踪 ====================

/** 子应用加载开始 */
export function trackAppLoadStart(appName: string): void {
  mark(`load_${appName}_start`);
}

/** 子应用加载结束 */
export function trackAppLoadEnd(appName: string, _fromCache = false): void {
  mark(`load_${appName}_end`);
  measure(`load:${appName}`, `load_${appName}_start`, `load_${appName}_end`);

  if (checkEnabled()) {
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

/** 子应用挂载开始 */
export function trackAppMountStart(appName: string): void {
  mark(`mount_${appName}_start`);
}

/** 子应用挂载结束 */
export function trackAppMountEnd(appName: string): void {
  mark(`mount_${appName}_end`);
  measure(`mount:${appName}`, `mount_${appName}_start`, `mount_${appName}_end`);
}

/** 子应用卸载开始 */
export function trackAppUnmountStart(appName: string): void {
  mark(`unmount_${appName}_start`);
}

/** 子应用卸载结束 */
export function trackAppUnmountEnd(appName: string): void {
  mark(`unmount_${appName}_end`);
  measure(`unmount:${appName}`, `unmount_${appName}_start`, `unmount_${appName}_end`);
}

/** Keep-alive 激活 */
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

/** Keep-alive 停用 */
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

/** 预加载触发 */
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

/** 消息通信 */
export function trackMessage(type: string, sourceApp: string, _targetApp?: string): void {
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

/** 全局状态变化 */
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

/** 路由跳转 */
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

/** 获取时间线数据 */
export function getTimelineCore(): TimelineEntry[] {
  return [...timeline];
}

/** 清除时间线数据 */
export function clearTimelineCore(): void {
  timeline.length = 0;
  import('./performance-tracker-memory').then(({ clearMemorySamples }) => {
    clearMemorySamples();
  });
}

/** 检查是否正在追踪 */
export function isTrackingCore(): boolean {
  return checkEnabled();
}

/** 获取追踪统计摘要 */
export function getStatsCore(): {
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
    memorySamples: 0, // 由 performance-tracker-memory 提供
    categories,
  };
}

/** 内部状态访问（供测试用） */
export function __getTimeline(): TimelineEntry[] {
  return timeline;
}
