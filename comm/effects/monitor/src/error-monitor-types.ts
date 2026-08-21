/**
 * 错误监控 — 类型定义
 *
 * 从 error-monitor.ts 提取，避免单文件超过 300 行。
 *
 * @path comm/effects/monitor/src/error-monitor-types.ts
 * @author ydsz-team
 * @since 3.0.0
 */

import type { Breadcrumb } from './breadcrumb';

/** 错误事件类型 */
export type ErrorType =
  | 'vue'
  | 'window'
  | 'promise'
  | 'resource';

/** 错误上报数据结构 */
export interface ErrorReport {
  type: ErrorType;
  message: string;
  stack?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  url?: string;
  timestamp: number;
  userAgent: string;
  appVersion?: string;
  userId?: string;
  route?: string;
  /** v3.1: 会话 ID，单次页面生命周期唯一 */
  sessionId?: string;
  /** v3.1: 错误追踪 ID，单条错误唯一，便于后端关联 */
  traceId?: string;
  /** v3.1: 发布版本（commit hash），用于 sourcemap 符号化 */
  release?: string;
  /** v3.4: 错误发生前的用户行为面包屑 */
  breadcrumbs?: Breadcrumb[];
  extra?: Record<string, any>;
}

/** 监控配置选项 */
export interface MonitorConfig {
  /** 发布版本标识（commit hash / 版本号），用于 sourcemap 关联 */
  release?: string;
  /** 采样率 0~1，默认 1（全量上报） */
  sampleRate?: number;
  /** 上报前钩子，返回 false 丢弃该错误，返回修改后的 report 可脱敏 */
  beforeSend?: (report: ErrorReport) => ErrorReport | null;
  /** 动态获取用户 ID（如从 Pinia store） */
  getUserId?: () => string | undefined;
  /** 上报失败时是否自动重试，默认 true */
  retry?: boolean;
  /** 最大重试次数，默认 3 */
  maxRetries?: number;
  /** 重试基础延迟（ms），默认 1000 */
  retryBaseDelay?: number;
  /**
   * Sentry DSN（可选）。设置后错误将同时转发到 Sentry APM。
   *
   * 启用流程：
   * 1. 在 .env.production 中设置 VITE_SENTRY_DSN=...
   * 2. 调用 initSentry({ dsn, release }) 在 bootstrap 中初始化
   * 3. 本模块会在 enqueueError 时自动向 Sentry 转发
   *
   * @since 4.0.0
   */
  sentryDsn?: string;
}
