/**
 * 全链路追踪增强
 *
 * <p>前端 TraceID 生成、Web Vitals 监控、请求耗时拆解。
 * <p>符合云顶编码规范 §14 错误处理与日志规范。
 *
 * <p>使用方式:
 * <pre>{@code
 *   import { generateTraceId, reportWebVitals, traceRequest } from '@ydsz/request';
 *
 *   // 生成 TraceID
 *   const traceId = generateTraceId();
 *
 *   // 上报 Web Vitals
 *   reportWebVitals();
 *
 *   // 追踪请求
 *   const data = await traceRequest('fetchUser', () => fetchUser(id));
 * }</pre>
 *
 * @path comm/effects/request/src/tracing.ts
 * @author ydsz-team
 * @since 4.0.0
 * @see docs/云顶编码规范.md
 */

/**
 * 生成 TraceID（UUID v7 格式，时间排序友好）
 *
 * <p>用于前后端全链路追踪关联：前端在每个请求头中注入 X-Trace-Id，
 * 后端 SkyWalking/SentryLogbackLayout 会自动拾取该值作为 traceId。
 *
 * @returns TraceID 字符串
 */
export function generateTraceId(): string {
  // 优先使用 crypto.randomUUID()（现代浏览器原生支持）
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // 降级方案：基于时间戳 + 随机数的简易 UUID
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  const random2 = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}-${random2}`;
}

/**
 * Web Vitals 指标
 */
export interface WebVitals {
  /** Largest Contentful Paint - 最大内容绘制 */
  lcp?: number;
  /** First Input Delay - 首次输入延迟 */
  fid?: number;
  /** Cumulative Layout Shift - 累积布局偏移 */
  cls?: number;
  /** First Contentful Paint - 首次内容绘制 */
  fcp?: number;
  /** Time to First Byte - 首字节时间 */
  ttfb?: number;
  /** Interaction to Next Paint - 交互到下一次绘制 */
  inp?: number;
}

/**
 * Web Vitals 回调函数类型
 */
export type WebVitalsCallback = (vitals: WebVitals) => void;

/**
 * 上报 Web Vitals 指标
 *
 * <p>收集核心 Web Vitals 指标并上报到监控系统。
 *
 * @param callback 回调函数，用于自定义上报逻辑
 */
export function reportWebVitals(callback?: WebVitalsCallback): void {
  const vitals: WebVitals = {};

  // 检查浏览器支持
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  try {
    // LCP - Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        vitals.lcp = lastEntry.startTime;
      }
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

    // FCP - First Contentful Paint
    const fcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      for (const entry of entries) {
        if (entry.name === 'first-contentful-paint') {
          vitals.fcp = entry.startTime;
        }
      }
    });
    fcpObserver.observe({ type: 'paint', buffered: true });

    // CLS - Cumulative Layout Shift
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        // 只计算用户未预期的布局偏移
        const layoutShiftEntry = entry as PerformanceEntry & {
          hadRecentInput?: boolean;
          value?: number;
        };
        if (!layoutShiftEntry.hadRecentInput) {
          clsValue += layoutShiftEntry.value ?? 0;
        }
      }
      vitals.cls = clsValue;
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });

    // TTFB - Time to First Byte
    const navigationEntry = performance.getEntriesByType(
      'navigation',
    )[0] as PerformanceNavigationTiming;
    if (navigationEntry) {
      vitals.ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
    }

    // 页面加载完成后统一上报
    window.addEventListener('load', () => {
      // 延迟上报，确保所有指标都已收集
      setTimeout(() => {
        if (callback) {
          callback(vitals);
        } else {
          void defaultWebVitalsReporter(vitals);
        }
      }, 1000);
    });
  } catch {
    // Web Vitals 收集失败不影响主流程
  }
}

/**
 * 默认 Web Vitals 上报器
 *
 * @param vitals Web Vitals 指标
 */
async function defaultWebVitalsReporter(vitals: WebVitals): Promise<void> {
  // 输出到控制台（开发环境）
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log('[Web Vitals]', vitals);
  }

  // 上报到监控系统
  try {
    const { captureMessage } = await import('@ydsz/monitor');
    if (captureMessage) {
      captureMessage('Web Vitals', {
        level: 'info',
        context: vitals,
      });
    }
  } catch {
    // 监控模块未初始化时忽略
  }
}

/**
 * 请求追踪配置
 */
export interface TraceRequestOptions {
  /** 请求名称 */
  name: string;
  /** 是否启用追踪 */
  enabled?: boolean;
  /** 额外上下文 */
  context?: Record<string, unknown>;
}

/**
 * 请求追踪结果
 */
export interface TraceResult<T> {
  /** 响应数据 */
  data: T;
  /** 请求耗时（毫秒） */
  duration: number;
  /** TraceID */
  traceId: string;
}

/**
 * 追踪异步请求
 *
 * <p>记录请求耗时、关联 TraceID，用于性能分析。
 *
 * @param options 追踪配置
 * @param fn 异步函数
 * @returns 追踪结果
 */
export async function traceRequest<T>(
  options: string | TraceRequestOptions,
  fn: () => Promise<T>,
): Promise<TraceResult<T>> {
  const config = typeof options === 'string' ? { name: options } : options;
  const { name, enabled = true, context = {} } = config;

  if (!enabled) {
    const data = await fn();
    return { data, duration: 0, traceId: '' };
  }

  const traceId = generateTraceId();
  const startTime = performance.now();

  try {
    const data = await fn();
    const duration = performance.now() - startTime;

    // 慢请求告警
    if (duration > 1000) {
      void reportSlowRequest(name, duration, traceId, context);
    }

    return { data, duration, traceId };
  } catch (error) {
    const duration = performance.now() - startTime;
    void reportFailedRequest(name, duration, traceId, error, context);
    throw error;
  }
}

/**
 * 上报慢请求
 *
 * @param name 请求名称
 * @param duration 耗时
 * @param traceId TraceID
 * @param context 上下文
 */
async function reportSlowRequest(
  name: string,
  duration: number,
  traceId: string,
  context: Record<string, unknown>,
): Promise<void> {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.warn(`[Slow Request] ${name} took ${duration.toFixed(2)}ms`, { traceId, ...context });
  }

  try {
    const { captureMessage } = await import('@ydsz/monitor');
    if (captureMessage) {
      captureMessage(`Slow Request: ${name}`, {
        level: 'warn',
        context: { duration, traceId, ...context },
      });
    }
  } catch {
    // 监控模块未初始化时忽略
  }
}

/**
 * 上报失败请求
 *
 * @param name 请求名称
 * @param duration 耗时
 * @param traceId TraceID
 * @param error 错误
 * @param context 上下文
 */
async function reportFailedRequest(
  name: string,
  duration: number,
  traceId: string,
  error: unknown,
  context: Record<string, unknown>,
): Promise<void> {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.error(`[Failed Request] ${name} failed after ${duration.toFixed(2)}ms`, error);
  }

  try {
    const { captureException } = await import('@ydsz/monitor');
    if (captureException) {
      captureException(error instanceof Error ? error : new Error(String(error)), {
        context: { requestName: name, duration, traceId, ...context },
      });
    }
  } catch {
    // 监控模块未初始化时忽略
  }
}

/**
 * 性能标记
 *
 * <p>用于标记关键操作的开始和结束，配合 Performance API 使用。
 *
 * @param markName 标记名称
 */
export function startPerformanceMark(markName: string): void {
  if (typeof performance !== 'undefined' && typeof performance.mark === 'function') {
    performance.mark(`${markName}-start`);
  }
}

/**
 * 结束性能标记并测量
 *
 * @param markName 标记名称
 * @returns 耗时（毫秒），不支持时返回 -1
 */
export function endPerformanceMark(markName: string): number {
  if (
    typeof performance !== 'undefined' &&
    typeof performance.mark === 'function' &&
    typeof performance.measure === 'function'
  ) {
    try {
      performance.mark(`${markName}-end`);
      performance.measure(markName, `${markName}-start`, `${markName}-end`);
      const entries = performance.getEntriesByName(markName);
      return entries[entries.length - 1]?.duration ?? -1;
    } catch {
      return -1;
    }
  }
  return -1;
}

/**
 * 页面加载性能指标
 *
 * @returns 页面加载性能指标
 */
export function getPageLoadMetrics(): Record<string, number> {
  const metrics: Record<string, number> = {};

  if (typeof performance === 'undefined') {
    return metrics;
  }

  try {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      metrics.dnsLookup = navigation.domainLookupEnd - navigation.domainLookupStart;
      metrics.tcpConnect = navigation.connectEnd - navigation.connectStart;
      metrics.ttfb = navigation.responseStart - navigation.requestStart;
      metrics.responseTime = navigation.responseEnd - navigation.responseStart;
      metrics.domInteractive = navigation.domInteractive;
      metrics.domComplete = navigation.domComplete;
      metrics.loadEvent = navigation.loadEventEnd - navigation.loadEventStart;
      metrics.totalDuration = navigation.duration;
    }
  } catch {
    // 忽略
  }

  return metrics;
}
