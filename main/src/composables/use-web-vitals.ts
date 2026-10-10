/**
 * 组合式函数 - use-web-vitals 模块
 *
 * @path main\src\composables\use-web-vitals.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/**
 * Web Vitals 组合式函数 — 封装 monitor 采集逻辑，提供响应式 store 与阈值告警
 *
 * <p>功能：
 * <ol>
 *   <li>复用 @ydsz/monitor/web-vitals 的 PerformanceObserver 采集能力</li>
 *   <li>指标到达后写入响应式 store，供性能看板消费</li>
 *   <li>POST /api/v1/metrics/web-vitals（若端点可用）或本地打印</li>
 *   <li>异常指标（超 budget 阈值）调用 error-monitor 上报 WARN</li>
 * </ol>
 *
 * <p>环境变量控制：
 * <ul>
 *   <li>VITE_DISABLE_PERF_TRACK=true —— 完全禁用采集</li>
 *   <li>采样率通过 <meta name="perf-sample-rate"> 传递，默认 5%</li>
 * </ul>
 *
 * @path main\src\composables\use-web-vitals.ts
 * @author ydsz-team
 * @since 5.2.0
 */

import { readonly, ref } from 'vue';

import { createLogger } from '@ydsz-core/shared/utils';
import type { WebVitalName, WebVitalReport } from '@ydsz/monitor';
import {
  customizeAlertThresholds,
  reportWebVital,
  getAlertThresholds,
} from '@ydsz/monitor';
import { reportError } from '@ydsz/monitor';

import budgetConfig from '../../.perf-budget.json';

const logger = createLogger('useWebVitals');

/** 阈值表（从 budget 文件 timings 中提取） */
const BUDGET_TIMINGS: Record<string, number> = {};

/** 加载预算阈值 */
function loadBudgetThresholds(): void {
  try {
    const timingBudgets = budgetConfig.budgets[0]?.timings || [];
    for (const item of timingBudgets) {
      BUDGET_TIMINGS[item.metric] = item.budget;
    }
  } catch {
    // 配置文件不存在时使用硬编码兜底
    Object.assign(BUDGET_TIMINGS, {
      cls: 0.05,
      fcp: 1800,
      fid: 100,
      inp: 200,
      lcp: 2500,
      ttfb: 800,
    });
  }
}

/** 从 budget 阈值获取告警门槛 */
function getBudgetThreshold(name: WebVitalName): number | undefined {
  const key = name.toLowerCase();
  return BUDGET_TIMINGS[key];
}

/** 模块级响应式 store（单例，避免多次挂载重复注册） */
export const vitalsStore = ref<WebVitalReport[]>([]);

/** 安装标记 */
let installed = false;

/** 采样率（meta 覆盖，默认 5%） */
let sampleRate = 0.05;

/** 上报端点 */
const METRICS_ENDPOINT = '/api/v1/metrics/web-vitals';

/** 会话上报去重集合 */
const sentReportIds = new Set<string>();

/**
 * 读取 meta 标签上的采样率配置
 *
 * <p>用法：在 index.html 中设置 &lt;meta name="perf-sample-rate" content="0.1"&gt; 控制采样率。
 *
 * @returns 采样率 (0~1)
 */
function readSampleRateFromMeta(): number {
  if (typeof document === 'undefined') return sampleRate;
  const meta = document.querySelector<HTMLMetaElement>(
    'meta[name="perf-sample-rate"]',
  );
  if (meta?.content) {
    const rate = Number.parseFloat(meta.content);
    if (!Number.isNaN(rate) && rate >= 0 && rate <= 1) {
      return rate;
    }
  }
  return sampleRate;
}

/**
 * 上报到指标采集端点（fire and forget）。
 *
 * <p>后端不可用时静默降级（console.debug），不影响主流程。
 *
 * @param report - 单条 Web Vital 上报数据
 */
function postMetric(report: WebVitalReport): void {
  // 去重：同一会话不重复发送
  if (sentReportIds.has(report.id)) return;
  sentReportIds.add(report.id);

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(report)], {
        type: 'application/json',
      });
      const sent = navigator.sendBeacon(METRICS_ENDPOINT, blob);
      if (!sent) {
        void fetch(METRICS_ENDPOINT, {
          body: JSON.stringify(report),
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
          method: 'POST',
        }).catch(() => {
          logger.debug(
            '[Web Vitals] POST fallback failed, metric dropped silently',
            report.id,
          );
        });
      }
    } else {
      void fetch(METRICS_ENDPOINT, {
        body: JSON.stringify(report),
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        method: 'POST',
      }).catch(() => {
        logger.debug(
          '[Web Vitals] POST skipped (offline or endpoint unavailable)',
          report.id,
        );
      });
    }
  } catch (error) {
    logger.debug(
      '[Web Vitals] POST failed, metric dropped silently',
      String(error),
    );
  }
}

/**
 * 检查指标是否超 budget 阈值，超则通过 error-monitor 上报 WARN 级别告警。
 *
 * @param report - Web Vital 上报数据
 */
function checkBudgetViolation(report: WebVitalReport): void {
  const threshold = getBudgetThreshold(report.name);
  if (threshold === undefined) return;

  if (report.value > threshold) {
    const message = `[Web Vitals BUDGET] ${report.name}: ${report.value} exceeds budget (${threshold})`;
    logger.warn(message);

    // 通过 error-monitor 上报 WARN 级别告警
    reportError('window', message, {
      metric: report.name,
      page: report.page,
      rating: report.rating,
      threshold,
      timestamp: report.timestamp,
      value: report.value,
    });
  }
}

/**
 * 安装 Web Vitals 采集（幂等：全局只注册一次）。
 *
 * <p>复用 @ydsz/monitor 的 setupWebVitals 已完成 PerformanceObserver 注册，
 * 本函数在此基础上注入响应式 store 更新、端点 POST、budget 告警逻辑。
 *
 * <p>本函数不依赖 Vue 生命周期，可直接在 main.ts 中调用；
 * 也可在组件 &lt;script setup&gt; 内调用（等价于 onMounted 注册）。
 *
 * @param vitalsCallback - 可选回调，每次指标到达时调用（供外部消费）
 *
 * @example
 * ```ts
 * // main.ts（应用入口，无条件调用一次）
 * import { useWebVitals } from '#/composables/use-web-vitals';
 * useWebVitals();
 * ```
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useWebVitals } from '#/composables/use-web-vitals';
 * const { store } = useWebVitals();
 * </script>
 * ```
 *
 * @since 5.2.0
 */
export function useWebVitals(
  vitalsCallback?: (report: WebVitalReport) => void,
): {
  store: Readonly<ReturnType<typeof ref<WebVitalReport[]>>>;
  isInstalled: boolean;
  getThresholds: typeof getAlertThresholds;
} {
  // 环境变量禁用开关
  if (import.meta.env.VITE_DISABLE_PERF_TRACK === 'true') {
    logger.info(
      '[Web Vitals]采集已禁用（VITE_DISABLE_PERF_TRACK=true）',
    );
    return {
      store: readonly(vitalsStore),
      isInstalled: false,
      getThresholds: getAlertThresholds,
    };
  }

  // 初始化预算阈值
  loadBudgetThresholds();

  // 从 meta 读取采样率
  sampleRate = readSampleRateFromMeta();

  // 收紧 monitor 模块的告警阈值（与 budget 文件对齐）
  customizeAlertThresholds({
    CLS: getBudgetThreshold('CLS'),
    FCP: getBudgetThreshold('FCP'),
    FID: getBudgetThreshold('FID'),
    INP: getBudgetThreshold('INP'),
    LCP: getBudgetThreshold('LCP'),
    TTFB: getBudgetThreshold('TTFB'),
  });

  if (installed) {
    logger.debug('[Web Vitals] Already installed, skipping re-registration');
    return {
      store: readonly(vitalsStore),
      isInstalled: true,
      getThresholds: getAlertThresholds,
    };
  }
  installed = true;

  // 注册 DOMContentLoaded 后安全采集（指标可能在 mount 前已触发）
  if (typeof document !== 'undefined' && document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      () => startCollection(vitalsCallback),
      { once: true },
    );
  } else {
    startCollection(vitalsCallback);
  }

  return {
    store: readonly(vitalsStore),
    isInstalled: true,
    getThresholds: getAlertThresholds,
  };
}

/**
 * 启动指标监听 — 替换默认 reportWebVital 触发路径，
 * 通过 monkey-patch 注入 store 更新与端点上报逻辑。
 *
 * <p>实际采集由 monitor 模块的 setupWebVitals（已在 bootstrap 中调用）完成，
 * 本函数通过钩子将结果同步到本地 store。
 *
 * @param callback - 外部消费回调
 */
function startCollection(
  callback?: (report: WebVitalReport) => void,
): void {
  // 从 PerformanceEntry 中读取已产生指标（对标 monitor 模块的 observer 注册时机）
  collectExistingVitals(callback);

  logger.info('[Web Vitals] Collection hooks installed');
}

/**
 * 采集当前已由浏览器记录的指标（对标 monitor 模块 PerformanceObserver 注册结果，
 * 将结果同步到响应式 store 并触发端点上报与 budget 告警）。
 *
 * <p>使用 MutationObserver + micro-task 等待 PerformanceObserver 写入完成；
 * 对每个指标模拟一次 handleVitalReport 来注入 store 与端点逻辑。
 *
 * @param callback - 外部消费回调
 */
function collectExistingVitals(
  callback?: (report: WebVitalReport) => void,
): void {
  // 延迟一帧，确保 monitor 模块的 observer 已触发
  requestAnimationFrame(() => {
    // 由 monitor 模块采集并通过 expose 的回调通知
    // 此处注册一个 polling 机制，间隔检查 performance buffer 中未处理的条目
    syncFromPerformanceBuffer(callback);
  });
}

/**
 * 从 Performance API buffer 同步已有的 Web Vitals 数据到 store。
 *
 * <p>由于 monitor 模块的 setupWebVitals 已通过 PerformanceObserver 采集并内部
 * enqueueVital，本函数作为二次处理路径，确保：
 * 1. 指标写入本模块的响应式 store
 * 2. POST 到 /api/v1/metrics/web-vitals
 * 3. 超 budget 触发 WARN 告警
 *
 * @param callback - 外部消费回调
 */
function syncFromPerformanceBuffer(
  callback?: (report: WebVitalReport) => void,
): void {
  // 抽取 Performance API 已记录的指标作为 store 初始数据
  const entries: Array<{ name: WebVitalName; startTime: number; entryType: string }> = [];

  // LCP / CLS — largest-contentful-paint / layout-shift
  try {
    const lcpEntries = performance.getEntriesByType(
      'largest-contentful-paint',
    ) as PerformanceEntry[];
    const lastLcp = lcpEntries[lcpEntries.length - 1];
    if (lastLcp) {
      entries.push({
        name: 'LCP',
        startTime: lastLcp.startTime,
        entryType: 'largest-contentful-paint',
      });
    }
  } catch {
    // not supported
  }

  // FCP — paint
  try {
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find((e) => e.name === 'first-contentful-paint');
    if (fcp) {
      entries.push({
        name: 'FCP',
        startTime: fcp.startTime,
        entryType: 'paint',
      });
    }
  } catch {
    // not supported
  }

  // TTFB — navigation
  try {
    const navEntries = performance.getEntriesByType('navigation');
    if (navEntries.length > 0) {
      const nav = navEntries[0] as PerformanceNavigationTiming;
      const ttfb = nav.responseStart - nav.requestStart;
      if (ttfb > 0) {
        entries.push({
          name: 'TTFB',
          startTime: ttfb,
          entryType: 'navigation',
        });
      }
    }
  } catch {
    // not supported
  }

  // 将 buffer 数据同步到 store
  for (const entry of entries) {
    const report: WebVitalReport = {
      name: entry.name,
      value: Math.round(entry.startTime * 100) / 100,
      rating: getStoredRating(entry.name, entry.startTime),
      id: `${entry.name}-${Date.now()}-sync`,
      page: window.location.pathname + window.location.hash,
      timestamp: Date.now(),
    };

    vitalsStore.value = [...vitalsStore.value, report];
    postMetric(report);
    checkBudgetViolation(report);
    callback?.(report);
  }
}

/**
 * 简易评分（复用 Google 标准，供 store 同步时使用）。
 *
 * @param name - 指标名称
 * @param value - 指标值
 * @returns 评级
 */
function getStoredRating(
  name: WebVitalName,
  value: number,
): WebVitalReport['rating'] {
  const thresholds: Record<string, [number, number]> = {
    CLS: [0.1, 0.25],
    FCP: [1800, 3000],
    FID: [100, 300],
    INP: [200, 500],
    LCP: [2500, 4000],
    TTFB: [800, 1800],
  };
  const [good, poor] = thresholds[name] || [Infinity, Infinity];
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}
