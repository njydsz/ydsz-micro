/**
 * 子应用级性能归因测试
 *
 * 覆盖 AppPerformanceTracker 的生命周期埋点、聚合报告、长任务归因与 LRU 淘汰。
 *
 * @path comm\effects\micro-kernel\src\app-performance.test.ts
 * @author ydsz-team
 * @since 26.11.07
 */

import { afterEach, describe, expect, it } from 'vitest';

import { AppPerformanceTracker, type AppPerformanceReport } from './app-performance';

describe('AppPerformanceTracker', () => {
  let tracker: AppPerformanceTracker;

  afterEach(() => {
    tracker?.clear();
  });

  /** 以固定时间戳驱动一次完整的加载 + 挂载周期 */
  function completeLifecycle(
    appName: string,
    loadStart: number,
    loadEnd: number,
    mountStart: number,
    mountEnd: number,
  ): void {
    tracker.beginLoad(appName, loadStart);
    tracker.endLoad(appName, loadEnd);
    tracker.beginMount(appName, mountStart);
    tracker.endMount(appName, mountEnd);
  }

  /** 取单个应用的报告（测试辅助：聚合结果必存在） */
  function singleReport(appName: string): AppPerformanceReport {
    const reports = tracker.report(appName);
    if (reports.length === 0) throw new Error(`no report for ${appName}`);
    return reports[0]!;
  }

  describe('生命周期埋点', () => {
    it('完整周期后聚合出三段耗时', () => {
      tracker = new AppPerformanceTracker();
      completeLifecycle('sub-a', 0, 100, 110, 180);

      const report = singleReport('sub-a');

      expect(report.loadDuration).toBe(100);
      expect(report.mountDuration).toBe(70);
      expect(report.totalDuration).toBe(180);
      expect(report.finished).toBe(true);
    });

    it('未完成加载时 loadDuration 为 null', () => {
      tracker = new AppPerformanceTracker();
      tracker.beginLoad('sub-a', 0);

      const report = singleReport('sub-a');

      expect(report.loadDuration).toBeNull();
      expect(report.mountDuration).toBeNull();
      expect(report.totalDuration).toBeNull();
      expect(report.finished).toBe(false);
    });

    it('已加载未挂载时 mountDuration 为 null', () => {
      tracker = new AppPerformanceTracker();
      tracker.beginLoad('sub-a', 0);
      tracker.endLoad('sub-a', 50);

      const report = singleReport('sub-a');

      expect(report.loadDuration).toBe(50);
      expect(report.mountDuration).toBeNull();
    });

    it('重复调用 endLoad 不覆盖首次时间戳', () => {
      tracker = new AppPerformanceTracker();
      tracker.beginLoad('sub-a', 0);
      tracker.endLoad('sub-a', 100);
      tracker.endLoad('sub-a', 200);

      const report = singleReport('sub-a');
      expect(report.loadDuration).toBe(100);
    });

    it('重复调用 beginLoad 开启新片段（后者覆盖前者）', () => {
      tracker = new AppPerformanceTracker();
      completeLifecycle('sub-a', 0, 100, 110, 180);
      // 第二次加载（keep-alive 恢复场景）
      tracker.beginLoad('sub-a', 500);
      tracker.endLoad('sub-a', 600);

      const report = singleReport('sub-a');
      // Map 语义下后者覆盖前者，故报告反映最新片段
      expect(report.loadDuration).toBe(100);
    });
  });

  describe('聚合报告', () => {
    it('不传 appName 时返回全部子应用报告', () => {
      tracker = new AppPerformanceTracker();
      completeLifecycle('sub-a', 0, 10, 11, 20);
      completeLifecycle('sub-b', 100, 150, 160, 300);

      const reports = tracker.report();

      expect(reports).toHaveLength(2);
      expect(reports.map((r) => r.appName).sort()).toEqual(['sub-a', 'sub-b']);
    });

    it('报告的时间窗覆盖 load-start 到 mount-end', () => {
      tracker = new AppPerformanceTracker();
      completeLifecycle('sub-a', 0, 10, 11, 20);

      const report = singleReport('sub-a');
      expect(report.window).toEqual({ start: 0, end: 20 });
    });

    it('未挂载时窗口终点回退到 loadEnd', () => {
      tracker = new AppPerformanceTracker();
      tracker.beginLoad('sub-a', 0);
      tracker.endLoad('sub-a', 42);

      const report = singleReport('sub-a');
      expect(report.window).toEqual({ start: 0, end: 42 });
    });
  });

  describe('长任务归因', () => {
    it('长任务落在子应用时间窗内时归因到该应用', () => {
      tracker = new AppPerformanceTracker();
      completeLifecycle('sub-a', 0, 100, 110, 500);

      const tasks = tracker.attributeLongTasks([{ startTime: 200, duration: 60 }]);
      const attribution = tasks[0]!;

      expect(attribution.appName).toBe('sub-a');
      expect(attribution.duration).toBe(60);
    });

    it('多个子应用时归因到正确的那个', () => {
      tracker = new AppPerformanceTracker();
      completeLifecycle('sub-a', 0, 100, 110, 200);
      completeLifecycle('sub-b', 300, 400, 410, 600);

      const attributions = tracker.attributeLongTasks([
        { startTime: 150, duration: 10 },
        { startTime: 500, duration: 20 },
      ]);

      expect(attributions[0]!.appName).toBe('sub-a');
      expect(attributions[1]!.appName).toBe('sub-b');
    });

    it('时间窗外归因到最接近的应用', () => {
      tracker = new AppPerformanceTracker();
      completeLifecycle('sub-a', 0, 100, 110, 200);

      // 远在工作时间窗之后 → 最接近的仍是 sub-a
      const tasks = tracker.attributeLongTasks([{ startTime: 900, duration: 5 }]);
      expect(tasks[0]!.appName).toBe('sub-a');
    });

    it('无记录时归因为 null', () => {
      tracker = new AppPerformanceTracker();

      const tasks = tracker.attributeLongTasks([{ startTime: 0, duration: 10 }]);

      expect(tasks[0]!.appName).toBeNull();
    });

    it('重叠窗口时优先取最窄的包含窗口', () => {
      tracker = new AppPerformanceTracker();
      // sub-a 窗口 [0, 1000]，sub-b 窗口 [100, 200]
      completeLifecycle('sub-a', 0, 400, 410, 1000);
      completeLifecycle('sub-b', 100, 150, 160, 200);

      const tasks = tracker.attributeLongTasks([{ startTime: 180, duration: 5 }]);

      // 180 同时落在两个窗口内，但 sub-b 的窗口更窄（完全包含）
      expect(tasks[0]!.appName).toBe('sub-b');
    });
  });

  describe('LRU 淘汰', () => {
    it('超过上限时淘汰最早的片段', () => {
      tracker = new AppPerformanceTracker(3);
      completeLifecycle('app-1', 0, 10, 11, 20);
      completeLifecycle('app-2', 100, 110, 111, 120);
      completeLifecycle('app-3', 200, 210, 211, 220);
      completeLifecycle('app-4', 300, 310, 311, 320);

      const reports = tracker.report();
      const names = reports.map((r) => r.appName);

      // app-1 应被淘汰
      expect(names).not.toContain('app-1');
      expect(names).toContain('app-4');
      expect(reports.length).toBe(3);
    });

    it('clear 后报告为空', () => {
      tracker = new AppPerformanceTracker();
      completeLifecycle('sub-a', 0, 10, 11, 20);

      tracker.clear();

      expect(tracker.report()).toHaveLength(0);
    });
  });
});
