/**
 * @ydsz/monitor — 前端监控公共模块
 *
 * 包含三大能力：
 * 1. 错误监控：Vue errorHandler + window.onerror + unhandledrejection + 资源加载错误
 * 2. Web Vitals 性能监控：LCP / FID / CLS / INP / FCP / TTFB
 * 3. 面包屑：用户行为轨迹，错误上报时附带
 *
 * 上报方式：通过 navigator.sendBeacon 批量发送到后端 /api/v1/monitor/*
 */

export {
  setupErrorMonitoring,
  reportError,
  enableSentryForwarding,
  disableSentryForwarding,
  setSentryForwarding,
} from './error-monitor';
export type { ErrorType, ErrorReport, MonitorConfig } from './error-monitor';

export {
  setupWebVitals,
  reportWebVital,
} from './web-vitals';
export type { WebVitalName, WebVitalReport } from './web-vitals';

export {
  addBreadcrumb,
  clearBreadcrumbs,
  getBreadcrumbs,
  setupBreadcrumbAutoCapture,
} from './breadcrumb';
export type { Breadcrumb, BreadcrumbCategory, BreadcrumbLevel } from './breadcrumb';

export {
  setupMonitor,
} from './setup';

export {
  initSentry,
  captureError as sentryCaptureError,
  captureMessage as sentryCaptureMessage,
  sentrySetUser,
  isSentryInitialized,
  getSentryConfig,
} from './sentry';
export type { SentryConfig } from './sentry';

// v4.0: 运行时性能追踪（火焰图、时间线、内存趋势）
export {
  isTracking,
  setTrackingEnabled,
  getFlameData,
  getTimeline,
  getMemoryTrend,
  getStats,
  clearTimeline,
  trackAppLoadStart,
  trackAppLoadEnd,
  trackAppMountStart,
  trackAppMountEnd,
  trackAppUnmountStart,
  trackAppUnmountEnd,
  trackKeepAliveActivate,
  trackKeepAliveDeactivate,
  trackPreload,
  trackMessage,
  trackStateChange,
  trackRouteChange,
} from './performance-tracker';
export type { FlameNode, TimelineEntry, MemorySample } from './performance-tracker';
