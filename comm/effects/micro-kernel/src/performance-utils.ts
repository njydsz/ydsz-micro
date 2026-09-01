/**
 * 性能标记工具 (Centralized Performance API)
 *
 * 统一管理 performance.mark / measure，防止 Performance Timeline 溢出。
 *
 * 浏览器对 Performance Timeline 有数量限制：
 * - Chrome: 默认 ~1500 条 measure 后自动截断
 * - 高频路由切换 + 大量子应用 + inspect 视图内嵌套 measure 容易触发截断
 *
 * 本模块提供：
 * 1. 缓冲写入：mark 后超过阈值时自动丢弃最旧条目
 * 2. 统一的 mark/measure 封装
 *
 * @path comm/effects/micro-kernel/src/performance-utils.ts
 * @author ydsz-team
 * @since 4.0.1 (ADR: P0-2 mark 缓冲保护)
 */

/**
 * 最大保留的 mark 条目数。
 *
 * 浏览器 limit 通常 1500，我们控制在 1000 以内留出余量。
 */
const MAX_MARK_ENTRIES = 1000;

/**
 * 最大保留的 measure 条目数。
 *
 * measure 通常比 mark 少得多（每个 mark pair 产生 1 个 measure），
 * 但依然设定上限防止极端场景。
 */
const MAX_MEASURE_ENTRIES = 500;

/** 定时清理间隔（ms）— 每 30s 执行一次缓冲区裁剪 */
const CLEANUP_INTERVAL_MS = 30_000;

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

/**
 * 启动定时清理。
 *
 * 在 setInterval 回调内执行，移除最旧的条目直到数量回到阈值以下。
 */
function ensureCleanupTimer(): void {
  if (cleanupTimer !== null || typeof performance === 'undefined') return;
  cleanupTimer = setInterval(() => {
    prunePerformanceEntries();
  }, CLEANUP_INTERVAL_MS);
}

/**
 * 裁剪 Performance Timeline 中的 mark / measure 至阈值以下。
 *
 * 通过 getEntriesByType 按时间戳升序排列后，移除最旧的条目。
 */
function prunePerformanceEntries(): void {
  if (typeof performance === 'undefined') return;

  try {
    // 仅移除我们自己的 kernel:* 前缀条目
    const marks = performance.getEntriesByType('mark');
    const kernelMarks = marks.filter((e) => e.name.startsWith('kernel:'));
    if (kernelMarks.length > MAX_MARK_ENTRIES) {
      const overflow = kernelMarks.length - MAX_MARK_ENTRIES;
      // 按时间戳升序排列，删除最旧的
      kernelMarks.sort((a, b) => a.startTime - b.startTime);
      for (let i = 0; i < overflow; i++) {
        performance.clearMarks(kernelMarks[i].name);
      }
    }

    const measures = performance.getEntriesByType('measure');
    const kernelMeasures = measures.filter((e) => e.name.startsWith('kernel:'));
    if (kernelMeasures.length > MAX_MEASURE_ENTRIES) {
      const overflow = kernelMeasures.length - MAX_MEASURE_ENTRIES;
      kernelMeasures.sort((a, b) => a.startTime - b.startTime);
      for (let i = 0; i < overflow; i++) {
        performance.clearMeasures(kernelMeasures[i].name);
      }
    }
  } catch {
    // Performance API 不可用时静默
  }
}

/**
 * 统一的 performance.mark 封装。
 *
 * 自动启动定时清理，条目超限时裁剪旧条目。
 *
 * @param name - 标记名称
 */
export function mark(name: string): void {
  if (typeof performance === 'undefined') return;
  ensureCleanupTimer();
  try {
    performance.mark(name);
  } catch {
    // 不可用时静默
  }
}

/**
 * 统一的 performance.measure 封装。
 *
 * 自动启动定时清理，条目超限时裁剪旧条目。
 *
 * @param name - 度量名称
 * @param startMark - 起始标记名
 * @param endMark - 结束标记名
 */
export function measure(name: string, startMark: string, endMark: string): void {
  if (typeof performance === 'undefined') return;
  ensureCleanupTimer();
  try {
    performance.measure(name, startMark, endMark);
  } catch {
    // 不可用时静默
  }
}

/**
 * 清理本模块注入的所有 kernel:* mark / measure。
 *
 * 供 HMR _stop / 测试 tearDown 使用。
 */
export function clearKernelMarks(): void {
  if (typeof performance === 'undefined') return;
  try {
    // clearMarks 不传参数会清除全部 mark，但仅限 kernel:* 前缀
    const marks = performance.getEntriesByType('mark');
    for (const m of marks) {
      if (m.name.startsWith('kernel:')) {
        performance.clearMarks(m.name);
      }
    }
    const measures = performance.getEntriesByType('measure');
    for (const m of measures) {
      if (m.name.startsWith('kernel:')) {
        performance.clearMeasures(m.name);
      }
    }
  } catch {
    // 静默
  }
}

/**
 * 获取当前 kernel:* 的 mark / measure 统计。
 *
 * 供 DevTools 面板展示性能健康状况。
 */
export function getPerfStats(): {
  markCount: number;
  measureCount: number;
  measures: Array<{ name: string; duration: number }>;
} {
  if (typeof performance === 'undefined') {
    return { markCount: 0, measureCount: 0, measures: [] };
  }
  try {
    const marks = performance.getEntriesByType('mark').filter((e) => e.name.startsWith('kernel:'));
    const measures = performance.getEntriesByType('measure').filter((e) => e.name.startsWith('kernel:'));
    return {
      markCount: marks.length,
      measureCount: measures.length,
      measures: measures.map((m) => ({ name: m.name, duration: Math.round(m.duration * 100) / 100 })),
    };
  } catch {
    return { markCount: 0, measureCount: 0, measures: [] };
  }
}

/**
 * 停止定时清理器。
 *
 * 供 HMR _stop 场景使用。
 */
export function stopCleanupTimer(): void {
  if (cleanupTimer !== null) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}

/**
 * P0-A1: 创建 performance-utils 生命周期管理器。
 *
 * 将 cleanupTimer 与 mark 缓冲区纳入 ManagerRegistry 统一释放，
 * 避免 _stop() 遗漏定时器清理导致 HMR 场景下的内存泄漏。
 *
 * @since 4.1.0
 */
export function createPerformanceManager(): DisposableManager {
  return {
    name: 'performance-utils',
    dispose(): void {
      stopCleanupTimer();
      clearKernelMarks();
    },
  };
}import type { DisposableManager } from "./manager-registry";

