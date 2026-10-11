/**
 * useNotification —— 增强版通知 API，支持操作按钮与持续时长控制。
 *
 * 在 showToast 基础上增加 action（操作按钮）、持久化等能力，
 * 对齐 Ant Design notification / Element Plus ElNotification 的高级形态。
 *
 * 用法示例：
 * ```ts
 * import { showNotification } from '@ydsz/notification';
 *
 * // 带"撤销"操作的通知
 * showNotification.success({
 *   title: '删除成功',
 *   description: '项目已被删除',
 *   action: { label: '撤销', onClick: () => restoreProject() },
 *   duration: 8000,
 * });
 *
 * // 持久通知（需手动关闭）
 * showNotification.info({
 *   title: '系统维护中',
 *   description: '预计 2 小时完成',
 *   duration: 0, // 0 = 手动关闭
 * });
 * ```
 *
 * @path comm/effects/notification/src/use-notification.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { ToastItem, ToastOptions } from './toast-state';
import { getGlobalToastState } from './toast-state';

/* ============================================================ */
/* 类型                                                          */
/* ============================================================ */

/** 通知动作按钮配置 */
export interface NotificationAction {
  /** 按钮文本 */
  label: string;
  /** 点击回调 */
  onClick: () => void;
}

/** 增强通知选项 */
export interface NotificationOptions extends Omit<ToastOptions, 'variant'> {
  /** 操作按钮（右侧显示） */
  action?: NotificationAction;
  /** 关闭按钮回调 */
  onClose?: () => void;
}

/** Notification API 接口 */
export interface NotificationApi {
  /** 信息（蓝色） */
  info: (options: NotificationOptions) => number;
  /** 成功（绿色） */
  success: (options: NotificationOptions) => number;
  /** 警告（橙色） */
  warning: (options: NotificationOptions) => number;
  /** 错误（红色） */
  error: (options: NotificationOptions) => number;
  /** 默认风格 */
  open: (options: NotificationOptions) => number;
  /** 手动关闭指定 id */
  dismiss: (id: number) => void;
}

/* ============================================================ */
/* 实现                                                          */
/* ============================================================ */

/** 通知输出函数 */
type NotifyFunction = (options: NotificationOptions) => number;

/**
 * showNotification —— 增强版通知 API。
 *
 * 提供 info / success / warning / error / open 五种风格，
 * 每个通知可带一个操作按钮（如"撤销"、"查看"）。
 */
export const showNotification: NotificationApi = {
  info: ((options: NotificationOptions): number => {
    return pushNotification({ ...options, variant: 'info' });
  }) as NotifyFunction,

  success: ((options: NotificationOptions): number => {
    return pushNotification({ ...options, variant: 'success' });
  }) as NotifyFunction,

  warning: ((options: NotificationOptions): number => {
    return pushNotification({ ...options, variant: 'warning' });
  }) as NotifyFunction,

  error: ((options: NotificationOptions): number => {
    return pushNotification({ ...options, variant: 'error' });
  }) as NotifyFunction,

  open: ((options: NotificationOptions): number => {
    return pushNotification({ ...options, variant: 'default' });
  }) as NotifyFunction,

  dismiss: (id: number): void => {
    const state = getGlobalToastState();
    const idx = state.items.findIndex((item: ToastItem) => item.id === id);
    if (idx >= 0) state.items.splice(idx, 1);
  },
};

/**
 * 将通知推入全局队列。
 */
function pushNotification(options: NotificationOptions & { variant?: string }): number {
  const state = getGlobalToastState();
  const id = ++state.seq;

  const item: ToastItem & { action?: NotificationAction; onClose?: () => void } = {
    id,
    title: options.title,
    description: options.description,
    variant: (options.variant as ToastItem['variant']) ?? 'default',
    duration: options.duration ?? 5000,
    action: options.action,
    onClose: options.onClose,
  };

  state.items.push(item);

  // 0 = 手动关闭，不自动清除
  if (item.duration && item.duration > 0) {
    setTimeout(() => {
      const idx = state.items.findIndex((i: ToastItem) => i.id === id);
      if (idx >= 0) state.items.splice(idx, 1);
    }, item.duration);
  }

  return id;
}

/** 兼容 showToast 存在的类型导出 */
export type {
  NotificationAction,
  NotificationOptions,
};
