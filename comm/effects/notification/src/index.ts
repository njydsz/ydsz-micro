/**
 * @ydsz/notification —— 全局通知与实时通信能力
 *
 * <p>提供四级 severity 对齐的 toast 与通知工具，过渡期内保留对 ElMessage 风格的兼容式封装：
 * <ul>
 *   <li>{@link showToastCompat} — 常规操作反馈（基于 shadcn-ui ToastProvider，自动关闭）</li>
 *   <li>{@link showNotify} — 桌面通知卡片（长停留）</li>
 *   <li>{@link showAlert} — 阻断式弹窗（FATAL/严重错误，需用户确认，使用 ydszAlert）</li>
 *   <li>{@link handleBusinessError} — 根据 {@link ExceptionSeverity} 自动选择展示方式</li>
 * </ul>
 *
 * <p>迁移进度（YDIZ-EP-001）：ElMessage/ElNotification 已逐步替换为 showToast/showNotify。
 * 长期目标：移除 element-plus peer dependency，完全基于 shadcn-ui 通知系统。
 *
 * @path comm/effects/notification/src/index.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { IconType } from '@ydsz-core/popup-ui';
import { ydszAlert } from '@ydsz-core/popup-ui';
import { useSimpleLocale } from '@ydsz-core/composables';

import type { ExceptionSeverity } from '@ydsz/request';

import { showToast } from './use-toast';

export type { ExceptionSeverity } from '@ydsz/request';

export { showToast } from './use-toast';
export { default as ToastProvider } from './ToastProvider.vue';

/**
 * EP 命令式 API 兼容对象。
 *
 * <p>业务侧将原 `from 'element-plus'` 替换为 `from '@ydsz/notification'`，
 * 即可零改动迁移 ElMessage / ElMessageBox / ElNotification 三种调用形式。
 * 底层实现已切换为 shadcn-ui + popup-ui + showToast，
 * 待 EP 全量退出后由 P2-1 决策保留或替换为原生 showToast/confirm/ydszAlert。
 */
export { ElMessage, ElMessageBox, ElNotification } from './el-bridge';
export type {
  ConfirmOptions,
  MessageArg,
  MessageOptions,
  MessageType,
  MessageBoxReturnValue,
  NotificationOptions,
  PromptOptions,
} from './el-bridge';

/** Toast 时长常量（毫秒） */
const DURATION = {
  /** INFO: 2s 自动关闭 */
  INFO: 2000,
  /** WARN: 3.5s 自动关闭 */
  WARN: 3500,
  /** ERROR: 6s 自动关闭 */
  ERROR: 6000,
} as const;

/** Toast 风格映射：level → shadcn toast variant */
const LEVEL_TOAST_VARIANT: Record<ExceptionSeverity, 'info' | 'warning' | 'error' | 'success'> = {
  INFO: 'info',
  WARN: 'warning',
  ERROR: 'error',
  FATAL: 'error',
};

/**
 * 常规操作反馈（使用全局 Toast 系统）。
 *
 * <p>自动关闭，非阻塞，适合常规操作成功/失败提示。
 * 内部使用基于 shadcn-ui ToastProvider 的 showToast，替代原 ElMessage。
 *
 * @param message — 提示文案
 * @param level — 严重等级（默认 WARN）
 */
export function showToastCompat(message: string, level: ExceptionSeverity = 'WARN'): void {
  const variant = LEVEL_TOAST_VARIANT[level];
  const duration = level === 'ERROR' ? DURATION.ERROR : level === 'INFO' ? DURATION.INFO : DURATION.WARN;
  showToast(message, { variant, duration });
}

/**
 * 桌面通知卡片（使用全局 Toast 系统的长停留模式）。
 *
 * <p>替代原 ElNotification，更醒目的长停留模式。
 *
 * @param title — 通知标题
 * @param message — 通知正文
 * @param level — 严重等级（默认 INFO）
 */
export function showNotify(
  title: string,
  message: string,
  level: ExceptionSeverity = 'INFO',
): void {
  const variant = LEVEL_TOAST_VARIANT[level];
  const duration = level === 'ERROR' ? DURATION.ERROR : DURATION.WARN;
  showToast(title, { description: message, variant, duration });
}

/**
 * 阻断式弹窗（使用 ydszAlert 命令式提示框）。
 *
 * <p>替代原 ElMessageBox.alert，FATAL / 严重错误场景必须用此函数。
 *
 * @param title — 弹窗标题
 * @param message — 弹窗正文
 * @param options — 额外配置项（按钮文案等）
 * @returns Promise<void> 用户确认后 resolve
 */
export async function showAlert(
  title: string,
  message: string,
  options: {
    confirmButtonText?: string;
    cancelButtonText?: string;
    showCancelButton?: boolean;
  } = {},
): Promise<void> {
  const { $t } = useSimpleLocale();
  await ydszAlert({
    title,
    content: message,
    confirmText: options.confirmButtonText ?? $t('common.confirm'),
    showCancel: options.showCancelButton ?? false,
    icon: 'error' as IconType,
  });
}

/**
 * 根据业务错误对象的 level 自动选择展示方式。
 *
 * <p>封装了常见的错误处理策略：
 * <ul>
 *   <li>INFO / WARN → showToastCompat（轻提示）</li>
 *   <li>ERROR → showNotify（醒目卡片）</li>
 *   <li>FATAL → showAlert（阻断式弹窗）</li>
 * </ul>
 *
 * @param message — 错误文案
 * @param level — 严重等级
 */
export function handleBusinessError(message: string, level: ExceptionSeverity = 'ERROR'): void {
  const { $t } = useSimpleLocale();
  switch (level) {
    case 'INFO':
    case 'WARN':
      showToastCompat(message, level);
      break;
    case 'ERROR':
      showNotify($t('common.error'), message, 'ERROR');
      break;
    case 'FATAL':
      void showAlert($t('common.fatalError'), message);
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
