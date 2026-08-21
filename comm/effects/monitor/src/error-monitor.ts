/**
 * 错误监控 — Vue + window + Promise + 资源加载错误捕获
 *
 * v3.1 增强：
 * - 会话追踪：每个错误携带 sessionId / traceId / release，支持全链路关联
 * - 采样控制：sampleRate + beforeSend 钩子，防止高频错误打满上报队列
 * - sourcemap 关联：release 字段供后端匹配 sourcemap 符号化 stack trace
 *
 * v3.4 增强：
 * - 面包屑：错误上报时附带最近 N 条用户行为轨迹
 * - 离线恢复：监听 online 事件自动重放离线缓存的上报
 *
 * 为控制单文件行数，以下内容已拆分为独立模块：
 * - error-monitor-types.ts：类型定义（ErrorType / ErrorReport / MonitorConfig）
 * - error-monitor-offline.ts：离线缓存（cacheForOffline / loadOfflineCache 等）
 * - error-monitor-queue.ts：队列管理（enqueueError / flushQueue / sendBatch / reportError 等）
 *
 * 本文件保留核心安装逻辑与公开 API，并重新导出类型以保持向后兼容。
 *
 * @path comm/effects/monitor/src/error-monitor.ts
 * @author ydsz-team
 * @since 3.0.0
 */

import type { ErrorType, ErrorReport, MonitorConfig } from './error-monitor-types';
import {
  setSentryForwarding,
  enableSentryForwarding,
  ensureSessionId,
  enqueueError,
  flushQueue,
  restoreOfflineCache,
  reportError,
  getCurrentRoute,
  __setMonitorConfig,
  __onBeforeUnload,
} from './error-monitor-queue';

// 向后兼容：重新导出类型
export type { ErrorType, ErrorReport, MonitorConfig } from './error-monitor-types';
export { cacheForOffline, loadOfflineCache, clearOfflineCache } from './error-monitor-offline';
export { setSentryForwarding, enableSentryForwarding, disableSentryForwarding } from './error-monitor-queue';
export { reportError } from './error-monitor-queue';

/**
 * 安装错误监控
 *
 * 在 app.mount() 之前调用 setupErrorMonitoring(app, config)
 * v3.1: config 支持采样率、beforeSend、release 版本标识
 */
export function setupErrorMonitoring(app: unknown, config: MonitorConfig = {}): void {
  __setMonitorConfig(config);
  ensureSessionId();

  // 1. Vue 组件错误
  (app as { config: { errorHandler?: unknown } }).config.errorHandler = (
    err: unknown,
    _instance: unknown,
    info: string,
  ) => {
    const report: ErrorReport = {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      timestamp: Date.now(),
      type: 'vue',
      url: getCurrentRoute(),
      userAgent: navigator.userAgent,
      extra: { lifecycleHook: info },
    };
    enqueueError(report);

    if (!import.meta.env.PROD) {
      console.error('[Vue Error]', err, info);
    }
  };

  // 2. window 全局错误
  window.addEventListener('error', (event) => {
    // 资源加载错误
    if (event.target && (event.target as HTMLElement).src) {
      const target = event.target as HTMLElement;
      const report: ErrorReport = {
        message: `Resource load failed: ${(target as HTMLImageElement).src || (target as HTMLAnchorElement).href}`,
        filename: (target as HTMLImageElement).src || (target as HTMLAnchorElement).href,
        timestamp: Date.now(),
        type: 'resource',
        url: getCurrentRoute(),
        userAgent: navigator.userAgent,
        extra: { tagName: target.tagName },
      };
      enqueueError(report);
      return;
    }

    // JS 运行时错误
    const report: ErrorReport = {
      colno: event.colno,
      filename: event.filename,
      lineno: event.lineno,
      message: event.message,
      stack: event.error?.stack,
      timestamp: Date.now(),
      type: 'window',
      url: getCurrentRoute(),
      userAgent: navigator.userAgent,
    };
    enqueueError(report);
  }, true);

  // 3. Promise 未捕获异常
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const report: ErrorReport = {
      message: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
      timestamp: Date.now(),
      type: 'promise',
      url: getCurrentRoute(),
      userAgent: navigator.userAgent,
      extra: reason && typeof reason === 'object' && 'config' in reason
        ? { url: (reason as { config: { url: string } }).config.url, method: (reason as { config: { method: string } }).config.method }
        : undefined,
    };
    enqueueError(report);
  });

  // 4. 页面卸载时强制上报
  window.addEventListener('beforeunload', __onBeforeUnload);

  // 5. 网络恢复时自动重放离线缓存的上报
  window.addEventListener('online', restoreOfflineCache);

  // 启动时若已在线，尝试重放上次会话遗留的离线缓存
  if (navigator.onLine) {
    restoreOfflineCache();
  }

  // v4.0 P0-3: 可选启用 Sentry 转发
  if (config.sentryDsn) {
    void (async () => {
      try {
        const { initSentry } = await import('./sentry');
        await initSentry({
          dsn: config.sentryDsn,
          release: config.release,
          environment: import.meta.env.MODE,
          sampleRate: config.sampleRate,
        });
        enableSentryForwarding();
      } catch {
        console.warn('[Monitor] Sentry auto-init failed, forwarding disabled');
      }
    })();
  }

  console.info('[Monitor] Error monitoring installed', {
    release: config.release,
    sampleRate: config.sampleRate ?? 1,
    sentryForwarding: !!config.sentryDsn,
  });
}
