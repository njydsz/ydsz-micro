/**
 * error-monitor-queue.ts — 错误监控队列管理
 *
 * 从 error-monitor.ts 提取的队列管理逻辑，包含：
 * - 错误队列入队（enqueueError）
 * - 批量上报（flush / sendBatch / scheduleRetry）
 * - Sentry 转发（forwardToSentry）
 * - 离线缓存恢复（restoreOfflineCache）
 * - 会话追踪（generateTraceId / ensureSessionId / enrichReport）
 *
 * @path comm/effects/monitor/src/error-monitor-queue.ts
 * @author ydsz-team
 * @since 4.1.0
 */

import { getBreadcrumbs } from './breadcrumb';
import { getErrorEndpoint } from './monitor-endpoints';

import type { ErrorReport, MonitorConfig } from './error-monitor-types';
import {
  cacheForOffline,
  loadOfflineCache,
  clearOfflineCache,
  restoreOfflineCache as restoreOfflineCacheBase,
} from './error-monitor-offline';

// 重新导出离线缓存函数
export { cacheForOffline, loadOfflineCache, clearOfflineCache } from './error-monitor-offline';

/** 上报端点（v4.4.0 起由 monitor-endpoints.ts 集中管理，可通过 setupMonitor 配置覆盖） */

/** 错误缓冲队列（批量上报） */
const errorQueue: ErrorReport[] = [];

/** 上报定时器 */
let flushTimer: null | ReturnType<typeof setTimeout> = null;

/** 最大缓冲数量 */
const MAX_QUEUE_SIZE = 10;

/** 上报间隔（ms） */
const FLUSH_INTERVAL = 10_000;

/** 单类型最大排队数 */
const MAX_PER_TYPE = 5;

/** 当前监控配置 */
let monitorConfig: MonitorConfig = {};

/** 当前会话 ID */
let sessionId = '';

/** Sentry 转发开关 */
let sentryForwardingEnabled = false;

/**
 * 设置 Sentry 转发开关
 */
export function setSentryForwarding(enabled: boolean): void {
  sentryForwardingEnabled = enabled;
}

/**
 * 动态启用 Sentry 转发
 */
export function enableSentryForwarding(): void {
  sentryForwardingEnabled = true;
}

/**
 * 动态禁用 Sentry 转发
 */
export function disableSentryForwarding(): void {
  sentryForwardingEnabled = false;
}

/**
 * 生成唯一 traceId
 */
export function generateTraceId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * 初始化会话 ID
 */
export function ensureSessionId(): string {
  if (!sessionId) {
    sessionId = generateTraceId();
  }
  return sessionId;
}

/**
 * 为错误报告注入会话追踪字段
 *
 * v3.4: 同时附带当前面包屑快照
 */
export function enrichReport(report: ErrorReport): ErrorReport {
  return {
    ...report,
    sessionId: ensureSessionId(),
    traceId: generateTraceId(),
    release: monitorConfig.release,
    userId: report.userId || monitorConfig.getUserId?.(),
    breadcrumbs: getBreadcrumbs(),
  };
}

/**
 * 设置监控配置
 */
export function __setMonitorConfig(config: MonitorConfig): void {
  monitorConfig = config;
}

/**
 * 获取当前队列长度（供测试用）
 */
export function __getQueueLength(): number {
  return errorQueue.length;
}

/**
 * 添加错误到队列并触发批量上报
 *
 * v3.1: 应用采样率 + beforeSend 钩子 + 单类型限流
 */
export function enqueueError(rawReport: ErrorReport): void {
  // 采样
  const sampleRate = monitorConfig.sampleRate ?? 1;
  if (sampleRate < 1 && Math.random() > sampleRate) {
    return;
  }

  let report = enrichReport(rawReport);

  // beforeSend 钩子
  if (monitorConfig.beforeSend) {
    const result = monitorConfig.beforeSend(report);
    if (!result) return;
    report = result;
  }

  // 避免重复上报同一错误（10秒内）
  const isDuplicate = errorQueue.some(
    (item) =>
      item.type === report.type &&
      item.message === report.message &&
      Date.now() - item.timestamp < 10_000,
  );
  if (isDuplicate) return;

  // 单类型限流
  const sameTypeCount = errorQueue.filter((e) => e.type === report.type).length;
  if (sameTypeCount >= MAX_PER_TYPE) {
    return;
  }

  errorQueue.push(report);

  // 转发到 Sentry
  if (sentryForwardingEnabled) {
    void forwardToSentry(report);
  }

  // 达到最大数量立即上报
  if (errorQueue.length >= MAX_QUEUE_SIZE) {
    flushQueue();
    return;
  }

  // 延迟批量上报
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flushQueue, FLUSH_INTERVAL);
}

/**
 * 将错误报告转发到 Sentry
 */
async function forwardToSentry(report: ErrorReport): Promise<void> {
  try {
    const { captureError } = await import('./sentry');
    captureError(report);
  } catch {
    // Sentry 未初始化或不可用 —— 静默降级
  }
}

/**
 * 批量上报错误到后端
 *
 * v3.2: 支持重试 + 离线缓存
 */
export function flushQueue(): void {
  if (errorQueue.length === 0) return;

  const batch = errorQueue.splice(0, errorQueue.length);
  flushTimer = null;

  sendBatch(batch, 0);
}

/**
 * 发送错误批次，支持重试
 */
export function sendBatch(batch: ErrorReport[], retryCount: number): void {
  const maxRetries = monitorConfig.maxRetries ?? 3;
  const retryBaseDelay = monitorConfig.retryBaseDelay ?? 1000;
  const shouldRetry = monitorConfig.retry !== false;

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify({ errors: batch })], {
        type: 'application/json',
      });
      const sent = navigator.sendBeacon(getErrorEndpoint(), blob);
      if (!sent && shouldRetry && retryCount < maxRetries) {
        scheduleRetry(batch, retryCount, retryBaseDelay);
      }
    } else {
      // @infra-fetch 基础设施层直用：监控上报降级通道（sendBeacon 不可用时），
      // 无统一请求客户端上下文（keepalive 语义 + 页面卸载窗口），云顶规范 §6.1 例外条款。
      fetch(getErrorEndpoint(), {
        body: JSON.stringify({ errors: batch }),
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        method: 'POST',
      })
        .then((res) => {
          if (!res.ok && shouldRetry && retryCount < maxRetries) {
            scheduleRetry(batch, retryCount, retryBaseDelay);
          }
        })
        .catch(() => {
          if (shouldRetry && retryCount < maxRetries) {
            scheduleRetry(batch, retryCount, retryBaseDelay);
          } else {
            cacheForOffline(batch);
          }
        });
    }
  } catch {
    cacheForOffline(batch);
  }
}

/**
 * 调度重试（指数退避 + 抖动）
 */
export function scheduleRetry(batch: ErrorReport[], retryCount: number, baseDelay: number): void {
  const delay = baseDelay * Math.pow(2, retryCount);
  const jitter = delay * 0.25 * (Math.random() * 2 - 1);
  const finalDelay = Math.max(0, delay + jitter);

  setTimeout(() => {
    sendBatch(batch, retryCount + 1);
  }, finalDelay);
}

/**
 * 恢复离线缓存的错误（网络恢复时调用）
 */
export function restoreOfflineCache(): void {
  restoreOfflineCacheBase(sendBatch);
}

/**
 * 手动上报错误
 */
export function reportError(
  type: ErrorReport['type'],
  message: string,
  extra?: Record<string, unknown>,
): void {
  enqueueError({
    colno: undefined,
    filename: undefined,
    lineno: undefined,
    message,
    stack: undefined,
    timestamp: Date.now(),
    type,
    url: window.location.href,
    userAgent: navigator.userAgent,
    extra,
  });
}

/**
 * 获取当前路由路径
 */
export function getCurrentRoute(): string {
  return window.location.pathname + window.location.hash;
}

/**
 * 页面卸载时强制上报（供 setupErrorMonitoring 注册）
 */
export function __onBeforeUnload(): void {
  flushQueue();
}
