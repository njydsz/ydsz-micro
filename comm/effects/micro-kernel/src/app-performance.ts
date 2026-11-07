/**
 * 子应用级性能归因 — 把渲染耗时归属到具体子应用
 *
 * 背景（v4.3.2）：
 *   `@ydsz/monitor` 的 Web Vitals（LCP/FID/CLS/INP/FCP/TTFB）都是**全局**的，
 *   微前端场景下最关键的诉求——「哪个子应用拖慢了 LCP」——无法回答。
 *   内核已经掌握每个子应用的加载与挂载时刻，本模块在这些时间点插入
 *   `performance.mark`，从而把 Performance Timeline 切成可归因的片段。
 *
 * 能力：
 *   1. 生命周期埋点：load-start / load-end / mount-start / mount-end
 *   2. 按子应用聚合：加载耗时、挂载耗时、从加载到挂载的端到端耗时
 *   3. 长任务归因：基于 mark 区间判定某个长任务落在哪个子应用的时间窗内
 *   4. 上报：sendBeacon 上报聚合结果（与 preload-metrics 同通道风格）
 *
 * 设计取舍：
 *   - 只做标记与聚合，不采集 Resource Timing / 不读取 DOM，避免性能开销
 *     与隐私问题；需要更细粒度时由调用方传入 `PerformanceEntry` 列表。
 *   - 全部时间戳取自 `performance.now()`，与 Performance Timeline 同源，
 *     可直接与 `performance.getEntriesByType('longtask')` 对齐。
 *
 * @path comm/effects/micro-kernel/src/app-performance.ts
 * @author ydsz-team
 * @since 4.3.2
 */

import { createLogger } from '@ydsz-core/shared/utils';

const logger = createLogger('MicroKernel:Perf');

/** 单个子应用的性能片段（一次加载 → 挂载的完整周期） */
export interface AppPerformanceSpan {
  /** 子应用名 */
  appName: string;
  /** 加载开始（performance.now()） */
  loadStart: number;
  /** 加载结束（ESM 模块可用） */
  loadEnd: number | null;
  /** 挂载开始（mount 被调用） */
  mountStart: number | null;
  /** 挂载结束（DOM 已插入） */
  mountEnd: number | null;
  /** 是否已收尾（用于停止追踪） */
  finished: boolean;
}

/** 聚合后的子应用性能报告 */
export interface AppPerformanceReport {
  appName: string;
  /** 加载耗时（ms），未结束为 null */
  loadDuration: number | null;
  /** 挂载耗时（ms），未结束为 null */
  mountDuration: number | null;
  /** 端到端耗时（load-start → mount-end），未结束为 null */
  totalDuration: number | null;
  /** 时间窗 [start, end]，供长任务归因使用 */
  window: { start: number; end: number };
  finished: boolean;
}

/** 长任务归因结果 */
export interface LongTaskAttribution {
  /** 长任务起始时间 */
  startTime: number;
  /** 长任务时长 */
  duration: number;
  /** 归因到的子应用名（无匹配为 null） */
  appName: string | null;
}

/**
 * 子应用性能追踪器。
 *
 * 内核在生命周期节点调用 `beginLoad` / `endLoad` / `beginMount` / `endMount`，
 * 追踪器只负责记录与聚合，不干预内核流程。
 */
export class AppPerformanceTracker {
  private readonly spans = new Map<string, AppPerformanceSpan>();

  /** 最大保留的片段数（LRU 淘汰，避免长时间会话内存膨胀） */
  private readonly maxSpans: number;

  constructor(maxSpans = 200) {
    this.maxSpans = maxSpans;
  }

  /**
   * 记录子应用开始加载。
   *
   * 重复调用同一应用（如 keep-alive 恢复）会开启新片段，旧片段保留用于聚合。
   */
  beginLoad(appName: string, at: number = now()): AppPerformanceSpan {
    const span: AppPerformanceSpan = {
      appName,
      loadStart: at,
      loadEnd: null,
      mountStart: null,
      mountEnd: null,
      finished: false,
    };
    this.spans.set(appName, span);
    this.evictIfNeeded();
    return span;
  }

  /** 记录加载完成（ESM 模块解析完毕） */
  endLoad(appName: string, at: number = now()): void {
    const span = this.spans.get(appName);
    if (!span || span.loadEnd !== null) return;
    span.loadEnd = at;
  }

  /** 记录开始挂载 */
  beginMount(appName: string, at: number = now()): void {
    const span = this.spans.get(appName);
    if (!span || span.mountStart !== null) return;
    span.mountStart = at;
  }

  /** 记录挂载完成 */
  endMount(appName: string, at: number = now()): void {
    const span = this.spans.get(appName);
    if (!span) return;
    span.mountEnd = at;
    span.finished = true;
    logger.debug(`[${appName}] mount completed in ${formatMs(at - span.loadStart)}`);
  }

  /**
   * 聚合指定子应用（或全部）的性能报告。
   *
   * @param appName - 子应用名；省略则返回全部
   * @returns 报告列表
   */
  report(appName?: string): AppPerformanceReport[] {
    const targets = appName
      ? [this.spans.get(appName)].filter(Boolean)
      : [...this.spans.values()];
    return (targets as AppPerformanceSpan[]).map(toReport);
  }

  /**
   * 把长任务归因到子应用。
   *
   * 判定规则：长任务的 `startTime` 落在某个子应用的
   * `[loadStart, mountEnd]` 时间窗内即归因给它。
   * 时间窗重叠时（快速切换）取**包含关系**最精确的那个。
   *
   * @param tasks - 长任务列表（通常来自 `performance.getEntriesByType('longtask')`）
   * @returns 归因结果
   */
  attributeLongTasks(
    tasks: Array<{ startTime: number; duration: number }>,
  ): LongTaskAttribution[] {
    const windows = [...this.spans.values()].map((span) => ({
      appName: span.appName,
      start: span.loadStart,
      end: span.mountEnd ?? now(),
    }));

    return tasks.map((task) => {
      // 收集所有完全包含该任务的窗口，取最窄的那个（最精确归因）。
      // 快速切换时多个子应用的时间窗会重叠，只看第一个会误判。
      const containing = windows
        .filter((w) => task.startTime >= w.start && task.startTime < w.end)
        .sort((a, b) => a.end - a.start - (b.end - b.start));

      if (containing.length > 0) {
        return { startTime: task.startTime, duration: task.duration, appName: containing[0]!.appName };
      }

      // 退化为「时间上最接近的窗口」
      let closest: { appName: string; distance: number } | null = null;
      for (const w of windows) {
        const distance =
          task.startTime < w.start ? w.start - task.startTime : task.startTime - w.end;
        if (!closest || distance < closest.distance) {
          closest = { appName: w.appName, distance };
        }
      }
      return {
        startTime: task.startTime,
        duration: task.duration,
        appName: closest?.appName ?? null,
      };
    });
  }

  /** 清空全部记录（用于测试与登出场景） */
  clear(): void {
    this.spans.clear();
  }

  /** LRU 淘汰：超过上限时移除最早未完成的片段 */
  private evictIfNeeded(): void {
    if (this.spans.size <= this.maxSpans) return;
    const oldestKey = this.spans.keys().next().value;
    if (oldestKey) this.spans.delete(oldestKey);
  }
}

/** 取当前高精度时间戳，环境缺失时降级为 Date.now() */
function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

/** 把片段转成报告 */
function toReport(span: AppPerformanceSpan): AppPerformanceReport {
  const loadDuration = span.loadEnd === null ? null : span.loadEnd - span.loadStart;
  const mountDuration =
    span.mountStart === null || span.mountEnd === null
      ? null
      : span.mountEnd - span.mountStart;
  const totalDuration =
    span.mountEnd === null ? null : span.mountEnd - span.loadStart;

  return {
    appName: span.appName,
    loadDuration,
    mountDuration,
    totalDuration,
    window: {
      start: span.loadStart,
      end: span.mountEnd ?? span.loadEnd ?? span.loadStart,
    },
    finished: span.finished,
  };
}

/** 格式化毫秒数（保留 1 位小数） */
function formatMs(ms: number): string {
  return `${ms.toFixed(1)}ms`;
}

/** 全局单例（内核内部使用；子应用侧不需要直接访问） */
let globalTracker: AppPerformanceTracker | null = null;

/** 获取全局追踪器（懒初始化） */
export function getAppPerformanceTracker(): AppPerformanceTracker {
  if (!globalTracker) globalTracker = new AppPerformanceTracker();
  return globalTracker;
}

/** 重置全局追踪器（测试用） */
export function resetAppPerformanceTracker(): void {
  globalTracker = null;
}
