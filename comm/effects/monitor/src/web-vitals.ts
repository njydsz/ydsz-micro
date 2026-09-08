/**
 * Web Vitals 性能监控 — LCP / FID / CLS / INP / FCP / TTFB
 *
 * 使用浏览器原生 PerformanceObserver API 采集 Core Web Vitals 指标。
 * 对标 Google Web Vitals 标准 + Sentry Performance + 阿里 ARMS。
 */

import { createLogger } from '@ydsz-core/shared/utils';

import { getWebVitalsEndpoint } from './monitor-endpoints';

const logger = createLogger('Monitor:WebVitals');

/** Web Vital 指标名称 */
export type WebVitalName =
  | 'LCP'  // Largest Contentful Paint
  | 'FID'  // First Input Delay
  | 'CLS'  // Cumulative Layout Shift
  | 'INP'  // Interaction to Next Paint
  | 'FCP'  // First Contentful Paint
  | 'TTFB' // Time to First Byte
  | 'LT'   // Long Task
  | 'RT'   // Resource Timing
  ;

/** Web Vital 上报数据 */
export interface WebVitalReport {
  name: WebVitalName;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  id: string;
  page: string;
  timestamp: number;
}

/** 上报端点（v4.4.0 起由 monitor-endpoints.ts 集中管理，可通过 setupMonitor 配置覆盖） */

/** 已上报的指标（避免重复） */
const reportedMetrics = new Set<string>();

/** 缓冲队列 */
const vitalsQueue: WebVitalReport[] = [];

/** 最大缓冲数量（达到后立即批量上报） */
const MAX_VITALS_QUEUE_SIZE = 6;

/** 批量上报间隔（ms） */
const VITALS_FLUSH_INTERVAL = 5_000;

/** 批量上报定时器 */
let vitalsFlushTimer: null | ReturnType<typeof setTimeout> = null;

/**
 * 批量上报缓冲队列中的 Web Vitals。
 *
 * v3.4: 此前每个指标单独 sendBeacon，造成 N 次网络请求；
 * 改为批量缓冲 + 单次请求，降低网络开销。
 */
function flushVitalsQueue(): void {
  if (vitalsQueue.length === 0) return;

  const batch = vitalsQueue.splice(0, vitalsQueue.length);
  vitalsFlushTimer = null;

  try {
    const payload = JSON.stringify({ vitals: batch });
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      const sent = navigator.sendBeacon(getWebVitalsEndpoint(), blob);
      // sendBeacon 失败时降级 fetch
      if (!sent) {
        // @infra-fetch 基础设施层直用，无统一客户端上下文（Web Vitals 批量上报，sendBeacon 失败降级）
        fetch(getWebVitalsEndpoint(), {
          body: payload,
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
          method: 'POST',
        }).catch(() => {});
      }
    } else {
      // @infra-fetch 基础设施层直用，无统一客户端上下文（Web Vitals 批量上报，无 sendBeacon 环境）
      fetch(getWebVitalsEndpoint(), {
        body: payload,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        method: 'POST',
      }).catch(() => {});
    }
  } catch {
    // 静默
  }
}

/**
 * 将指标加入缓冲队列，按数量或时间触发批量上报。
 */
function enqueueVital(report: WebVitalReport): void {
  vitalsQueue.push(report);

  // 达到最大数量立即上报
  if (vitalsQueue.length >= MAX_VITALS_QUEUE_SIZE) {
    if (vitalsFlushTimer) {
      clearTimeout(vitalsFlushTimer);
      vitalsFlushTimer = null;
    }
    flushVitalsQueue();
    return;
  }

  // 延迟批量上报
  if (!vitalsFlushTimer) {
    vitalsFlushTimer = setTimeout(flushVitalsQueue, VITALS_FLUSH_INTERVAL);
  }
}

/**
 * 告警阈值配置（与 Google 标准对齐，可按业务 tightened）。
 *
 * <p>各指标阈值含义：
 * <ul>
 *   <li>LCP &le; 2.5s good / &le; 4.0s needs-improvement / &gt; 4.0s poor</li>
 *   <li>FID &le; 100ms good / &le; 300ms ni / &gt; 300ms poor</li>
 *   <li>CLS &le; 0.1 good / &le; 0.25 ni / &gt; 0.25 poor</li>
 *   <li>INP &le; 200ms good / &le; 500ms ni / &gt; 500ms poor</li>
 *   <li>FCP &le; 1.8s good / &le; 3.0s ni / &gt; 3.0s poor</li>
 *   <li>TTFB &le; 800ms good / &le; 1.8s ni / &gt; 1.8s poor</li>
 * </ul>
 *
 * @since 1.2.0 (P1-4)
 */
export interface WebVitalAlertThresholds {
  CLS?: number;   // 默认 0.25 (poor 阈值)
  FCP?: number;   // 默认 3000ms
  FID?: number;   // 默认 300ms
  INP?: number;   // 默认 500ms
  LCP?: number;   // 默认 4000ms
  TTFB?: number;  // 默认 1800ms
}

/** 默认告警阈值（取 Google "poor" 临界值） */
const DEFAULT_ALERT_THRESHOLDS: Required<WebVitalAlertThresholds> = {
  CLS: 0.25,
  FCP: 3000,
  FID: 300,
  INP: 500,
  LCP: 4000,
  TTFB: 1800,
};

/** 当前生效的告警阈值（由 customizeAlertThresholds 覆盖） */
let alertThresholds: Required<WebVitalAlertThresholds> = { ...DEFAULT_ALERT_THRESHOLDS };

/** 已触发的告警 key 集合（同一页面同指标不重复告警） */
const alertedMetrics = new Set<string>();

/**
 * 自定义告警阈值。
 *
 * <p>在 setupWebVitals 前调用无效（会在安装时被覆盖），应在 setupMonitor 之前设置。
 *
 * @param thresholds - 部分或全部指标的告警阈值（未传入项使用默认值）
 *
 * @since 1.2.0 (P1-4)
 */
export function customizeAlertThresholds(thresholds: WebVitalAlertThresholds): void {
  alertThresholds = { ...alertThresholds, ...thresholds };
}

/**
 * 获取当前生效的告警阈值（只读副本）。
 *
 * @returns 当前阈值配置
 *
 * @since 1.2.0 (P1-4)
 */
export function getAlertThresholds(): Readonly<Required<WebVitalAlertThresholds>> {
  return { ...alertThresholds };
}

/**
 * 判断指标值是否触发告警阈值。
 *
 * @param name - 指标名称（LT / RT 无阈值，恒为 false）
 * @param value - 指标值
 * @returns 是否超出告警阈值
 */
function isAlertTriggered(name: WebVitalName, value: number): boolean {
  switch (name) {
    case 'CLS':
      return value > alertThresholds.CLS;
    case 'FCP':
      return value > alertThresholds.FCP;
    case 'FID':
      return value > alertThresholds.FID;
    case 'INP':
      return value > alertThresholds.INP;
    case 'LCP':
      return value > alertThresholds.LCP;
    case 'TTFB':
      return value > alertThresholds.TTFB;
    default:
      return false;
  }
}

/**
 * 主动上报告警事件。
 *
 * <p>通过 sendBeacon（或降级 fetch）向专用告警端点 POST 告警数据，
 * 后端对接的企业 IM / 邮件通知由服务端处理。
 *
 * @param report - 触发的 Web Vital 告警数据
 */
function sendAlert(report: WebVitalReport): void {
  const alertPayload = JSON.stringify({
    alert: true,
    metric: report,
    page: report.page,
    timestamp: report.timestamp,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    url: typeof window !== 'undefined' ? window.location.href : '',
  });

  try {
    const endpoint = getWebVitalsAlertEndpoint();
    if (navigator.sendBeacon) {
      const blob = new Blob([alertPayload], { type: 'application/json' });
      const sent = navigator.sendBeacon(endpoint, blob);
      if (!sent) {
        fetch(endpoint, {
          body: alertPayload,
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
          method: 'POST',
        }).catch(() => {});
      }
    } else {
      fetch(endpoint, {
        body: alertPayload,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        method: 'POST',
      }).catch(() => {});
    }
  } catch {
    // 静默
  }
}

/** 评分阈值（Google 标准）
 *
 * @param name - 指标名称
 * @param value - 指标值
 * @returns 评级：'good' | 'needs-improvement' | 'poor'
 */
function getRating(name: WebVitalName, value: number): WebVitalReport['rating'] {
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

/**
 * 上报单个 Web Vital 指标
 *
 * v3.4: 改为加入缓冲队列批量上报，不再逐条 sendBeacon
 * v1.2: 集成阈值告警，当 rating 为 'poor' 时主动向告警端点发送即时告警
 */
export function reportWebVital(
  name: WebVitalName,
  value: number,
  delta?: number,
) {
  // 同一页面加载只上报一次每种指标（除 CLS 外）
  if (name !== 'CLS' && reportedMetrics.has(name)) return;
  reportedMetrics.add(name);

  const report: WebVitalReport = {
    delta,
    id: `${name}-${Date.now()}`,
    name,
    page: window.location.pathname + window.location.hash,
    rating: getRating(name, value),
    timestamp: Date.now(),
    value: Math.round(value * 100) / 100,
  };

  enqueueVital(report);

  // P1-4: 阈值告警检测（poor 级指标立即上报）
  if (name !== 'LT' && name !== 'RT' && isAlertTriggered(name, report.value)) {
    const alertKey = `${name}@${report.page}`;
    if (!alertedMetrics.has(alertKey)) {
      alertedMetrics.add(alertKey);
      // 开发环境打印告警
      if (!import.meta.env.PROD) {
        logger.warn(`[Web Vitals ALERT] ${name}: ${report.value} exceeds threshold (${String(getAlertThresholds()[name as keyof WebVitalAlertThresholds])})`);
      }
      sendAlert(report);
    }
  }

  // 开发环境打印
  if (!import.meta.env.PROD) {
    logger.debug(`[Web Vitals] ${name}: ${report.value} (${report.rating})`);
  }
}

/**
 * 安装 Web Vitals 监控
 */
export function setupWebVitals() {
  // 1. LCP — 最大内容渲染
  try {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        reportWebVital('LCP', lastEntry.startTime);
      }
    }).observe({ buffered: true, type: 'largest-contentful-paint' });
  } catch {
    // 浏览器不支持
  }

  // 2. FID — 首次输入延迟
  try {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      for (const entry of entries) {
        const fidEntry = entry as PerformanceEventTiming;
        reportWebVital(
          'FID',
          fidEntry.processingStart - fidEntry.startTime,
        );
      }
    }).observe({ buffered: true, type: 'first-input' });
  } catch {
    // 浏览器不支持
  }

  // 3. CLS — 累积布局偏移
  try {
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // LayoutShift 为较新的 PerformanceEntry 子类型，
        // 当前 TS DOM lib 未内置，按结构收窄
        const layoutShift = entry as unknown as {
          hadRecentInput: boolean;
          value: number;
        };
        if (!layoutShift.hadRecentInput) {
          clsValue += layoutShift.value;
        }
      }
      reportWebVital('CLS', clsValue);
    }).observe({ buffered: true, type: 'layout-shift' });
  } catch {
    // 浏览器不支持
  }

  // 4. INP — 交互到下次渲染
  try {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        const lastEntry = entries[entries.length - 1] as PerformanceEventTiming;
        reportWebVital(
          'INP',
          lastEntry.processingEnd - lastEntry.startTime,
        );
      }
    }).observe({ buffered: true, type: 'event' });
  } catch {
    // 浏览器不支持
  }

  // 5. FCP — 首次内容渲染
  try {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const firstEntry = entries[0];
      if (firstEntry) {
        reportWebVital('FCP', firstEntry.startTime);
      }
    }).observe({ buffered: true, type: 'paint' });
  } catch {
    // 浏览器不支持
  }

  // 6. TTFB — 首字节时间
  try {
    const navEntries = performance.getEntriesByType('navigation');
    if (navEntries.length > 0) {
      const navEntry = navEntries[0] as PerformanceNavigationTiming;
      const ttfb = navEntry.responseStart - navEntry.requestStart;
      if (ttfb > 0) {
        reportWebVital('TTFB', ttfb);
      }
    }
  } catch {
    // 浏览器不支持
  }

  // 7. Long Task 监控（超过 50ms 的任务）
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          reportWebVital('LT', entry.duration);
        }
      }
    }).observe({ buffered: true, type: 'longtask' });
  } catch {
    // 浏览器不支持
  }

  logger.info('[Monitor] Web Vitals monitoring installed');

  // 页面卸载时强制 flush 缓冲队列，避免丢失未达批量阈值的指标
  window.addEventListener('beforeunload', flushVitalsQueue);
}
