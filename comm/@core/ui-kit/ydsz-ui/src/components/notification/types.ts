/**
 * Notification 组件与命令式 API 的 TypeScript 类型定义。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\notification\types.ts
 * @author ydsz-team
 * @since 5.7.0
 */

import type { Component, ComputedRef } from 'vue';

/* ============================================================ */
/* 基础类型                                                       */
/* ============================================================ */

/** 通知语义级别 */
export type NotificationType = 'error' | 'info' | 'success' | 'warning';

/** 通知展示位置 */
export type NotificationPosition =
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center'
  | 'bottom-center';

/* ============================================================ */
/* 声明式组件 Props                                               */
/* ============================================================ */

/** YdNotification 组件的 Props */
export interface NotificationProps {
  /** 自定义类名 */
  class?: string;
  /** 描述文本 */
  description?: string;
  /** 自动关闭时长（毫秒），0 表示常驻 */
  duration?: number;
  /** 自定义图标组件 */
  icon?: Component;
  /** 唯一标识 */
  id: string;
  /** 通知消息文本 */
  message: string;
  /** 是否显示级别图标 */
  showIcon?: boolean;
  /** 语义级别 */
  type?: NotificationType;
}

/* ============================================================ */
/* 命令式 API 类型                                                 */
/* ============================================================ */

/** 完整的 Notification 消息项（内部使用，附加运行时数据） */
export interface NotificationMessage {
  /** 唯一标识 */
  id: string;
  /** 语义级别 */
  type: NotificationType;
  /** 通知消息文本 */
  message: string;
  /** 描述文本 */
  description?: string;
  /** 自定义图标组件 */
  icon?: Component;
  /** 展示位置 */
  position: NotificationPosition;
  /** 自动关闭时长（毫秒），0 表示常驻 */
  duration: number;
  /** 是否显示级别图标 */
  showIcon: boolean;
  /** 创建时间戳 */
  createdAt: number;
}

/** 调用 add 时传入的 options */
export interface NotificationOptions {
  /** 语义级别 */
  type?: NotificationType;
  /** 通知消息文本 */
  message: string;
  /** 描述文本 */
  description?: string;
  /** 自定义图标组件 */
  icon?: Component;
  /** 展示位置 */
  position?: NotificationPosition;
  /** 自动关闭时长（毫秒），0 表示常驻 */
  duration?: number;
  /** 是否显示级别图标 */
  showIcon?: boolean;
}

/** 全局默认配置 */
export interface NotificationConfig {
  /** 默认自动关闭时长（毫秒），0 表示常驻 */
  duration?: number;
  /** 同时可见的最大条数，0 表示不限制 */
  maxVisible?: number;
  /** 默认展示位置 */
  position?: NotificationPosition;
}

/** 单条 Notification 操作句柄 */
export interface NotificationHandle {
  /** 此条消息的 id */
  id: string;
  /** 关闭此条通知 */
  close: () => void;
}

/** useNotification composable 返回句柄 */
export interface UseNotificationReturn {
  /** 当前消息列表（只读，可绑定 YdNotificationContainer） */
  messages: ComputedRef<NotificationMessage[]>;
  /** 程序化添加通知 */
  add: (options: NotificationOptions) => NotificationHandle;
  /** 快捷：成功通知 */
  success: (message: string, options?: Partial<NotificationOptions>) => NotificationHandle;
  /** 快捷：信息通知 */
  info: (message: string, options?: Partial<NotificationOptions>) => NotificationHandle;
  /** 快捷：警告通知 */
  warning: (message: string, options?: Partial<NotificationOptions>) => NotificationHandle;
  /** 快捷：错误通知 */
  error: (message: string, options?: Partial<NotificationOptions>) => NotificationHandle;
  /** 更新指定通知 */
  update: (id: string, options: Partial<NotificationOptions>) => void;
  /** 关闭指定 id */
  remove: (id: string) => void;
  /** 关闭全部 */
  removeAll: () => void;
}
