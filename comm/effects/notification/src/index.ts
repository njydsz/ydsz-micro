/**
 * @ydsz/notification — 全局通知与实时通信能力
 *
 * <p>提供四级 severity 对齐的 toast 与 ElMessage 通知工具，
 * <ul>
 *   <li>{@link showToast} — 常规操作反馈（自动关闭，对齐 §14 错误处理）</li>
 *   <li>{@link showNotify} — 桌面通知（右上角通知卡片，停留时间更长）</li>
 *   <li>{@link showAlert} — 阻断式弹窗（FATAL/严重错误，需用户确认）</li>
 *   <li>{@link handleBusinessError} — 根据 {@link BusinessError.level} 自动选择展示方式</li>
 * </ul>
 *
 * @path comm/effects/notification/src/index.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { ExceptionSeverity } from '@ydsz/request';
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus';
import type { MessageBoxOptions } from 'element-plus';

export type { ExceptionSeverity } from '@ydsz/request';

/** Toast 时长常量（毫秒） */
const DURATION = {
  /** INFO: 2s 自动关闭 */
  INFO: 2000,
  /** WARN: 3.5s 自动关闭 */
  WARN: 3500,
  /** ERROR: 6s 自动关闭 */
  ERROR: 6000,
  /** FATAL: 不自动关闭（需用户操作） */
  FATAL: 0,
} as const;

/** Toast 风格映射：level → Element Plus message type */
const LEVEL_MESSAGE_TYPE: Record<ExceptionSeverity, 'info' | 'warning' | 'error' | 'success'> = {
  INFO: 'info',
  WARN: 'warning',
  ERROR: 'error',
  FATAL: 'error',
};

/**
 * 常规操作反馈（使用 ElMessage）。
 *
 * <p>自动关闭，非阻塞，适合常规操作成功/失败提示。
 *
 * @param message - 提示文案
 * @param level - 严重等级（默认 WARN）
 */
export function showToast(message: string, level: ExceptionSeverity = 'WARN'): void {
  const type = LEVEL_MESSAGE_TYPE[level];

  if (level === 'ERROR') {
    // ERROR 级别：手动关闭 + 较长停留
    ElMessage({
      message,
      type,
      duration: DURATION.ERROR,
      showClose: true,
      grouping: true,
    });
    return;
  }

  if (level === 'INFO') {
    ElMessage({
      message,
      type,
      duration: DURATION.INFO,
      grouping: true,
    });
    return;
  }

  // WARN 级别
  ElMessage({
    message,
    type,
    duration: DURATION.WARN,
    showClose: true,
    grouping: true,
  });
}

/**
 * 桌面通知（使用 ElNotification）。
 *
 * <p>右上角通知卡片，停留时间更长，适合重要但不阻断操作的消息。
 *
 * @param title - 通知标题
 * @param message - 通知正文
 * @param level - 严重等级（默认 INFO）
 */
export function showNotify(
  title: string,
  message: string,
  level: ExceptionSeverity = 'INFO',
): void {
  const typeMap: Record<ExceptionSeverity, 'info' | 'warning' | 'error' | 'success'> = {
    INFO: 'info',
    WARN: 'warning',
    ERROR: 'error',
    FATAL: 'error',
  };

  ElNotification({
    title,
    message,
    type: typeMap[level],
    duration: level === 'ERROR' ? DURATION.ERROR : DURATION.WARN,
  });
}

/**
 * 阻断式弹窗（使用 ElMessageBox.alert）。
 *
 * <p>仅用于 FATAL / 严重错误场景，用户必须点击确认按钮。
 *
 * @param title - 弹窗标题
 * @param message - 弹窗正文
 * @param options - 额外配置项（按钮文案等）
 * @returns Promise<void> 用户确认后 resolve
 */
export function showAlert(
  title: string,
  message: string,
  options: Partial<Pick<MessageBoxOptions, 'confirmButtonText' | 'cancelButtonText' | 'showCancelButton'>> = {},
): Promise<void> {
  return ElMessageBox.alert(message, title, {
    confirmButtonText: options.confirmButtonText ?? '确定',
    showCancelButton: options.showCancelButton ?? false,
    ...options,
    type: 'error',
    dangerouslyUseHTMLString: false,
  }).then(() => undefined);
}

/**
 * 根据业务错误对象的 level 自动选择展示方式。
 *
 * <p>封装了常见的错误处理策略：
 * <ul>
 *   <li>INFO / WARN → showToast（ElMessage）</li>
 *   <li>ERROR → showNotify（ElNotification，更醒目）</li>
 *   <li>FATAL → showAlert（ElMessageBox，阻断）</li>
 * </ul>
 *
 * @param message - 错误文案
 * @param level - 严重等级
 */
export function handleBusinessError(message: string, level: ExceptionSeverity = 'ERROR'): void {
  switch (level) {
    case 'INFO':
    case 'WARN':
      showToast(message, level);
      break;
    case 'ERROR':
      showNotify('业务错误', message, 'ERROR');
      break;
    case 'FATAL':
      void showAlert('严重错误', message);
      break;
  }
}

// =====================================================================
// WebSocket 实时通信
// =====================================================================

export {
  useWebSocket,
} from './use-websocket';
export type { WebSocketStatus, UseWebSocketOptions, UseWebSocketReturn } from './use-websocket';
