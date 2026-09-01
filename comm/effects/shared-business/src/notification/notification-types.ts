/**
 * 全局通知中心类型契约。
 *
 * <p>统一管理多种类型的事件通知：
 * <ul>
 *   <li>系统通知（maintenance / alert）— 后端广播</li>
 *   <li>业务流程通知（审批待办 / 流程流转结果）— 用户定向</li>
 *   <li>消息通知（未读数变化 / @提及）— 实时推送</li>
 *   <li>审计事件（权限变更 / 安全告警）— 即时生效</li>
 * </ul>
 *
 * <p>各类型在 UI 中以 tab 或 tag 分组展示，支持「标记已读」「批量处理」能力。
 * SSE 通道扩展（P2-15）叠加在 SseEvent 之上，后端推送多路复用事件类型。
 *
 * @path comm/effects/shared-business/src/notification/notification-types.ts
 * @author ydsz-team
 * @since 4.1.0 (P2-15)
 */

/** 通知类型枚举 */
export enum NotificationType {
  /** 系统级通知（广播） */
  SYSTEM = 'system',
  /** 审批 / 流程待办 */
  WORKFLOW = 'workflow',
  /** 消息未读 / 提及 */
  MESSAGE = 'message',
  /** 安全审计事件 */
  AUDIT = 'audit',
}

/** 通知优先级 */
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

/** 单条通知记录 */
export interface NotificationItem {
  /** 通知唯一 ID */
  id: string;
  /** 通知类型 */
  type: NotificationType;
  /** 标题 */
  title: string;
  /** 内容（纯文本） */
  content: string;
  /** 优先级 */
  priority?: NotificationPriority;
  /** 发送时间（ISO 8601） */
  timestamp: string;
  /** 是否已读 */
  read: boolean;
  /** 来源模块（用于筛选 / 跳转） */
  source?: string;
  /** 关联资源 ID（如 taskId、messageId） */
  resourceId?: string;
  /** 跳转路径 */
  link?: string;
  /** 操作按钮 */
  actions?: NotificationAction[];
  /** 附加元数据 */
  metadata?: Record<string, unknown>;
}

/** 通知操作按钮 */
export interface NotificationAction {
  /** 操作 ID */
  key: string;
  /** 按钮文本 */
  label: string;
  /** 操作类型 */
  type: 'link' | 'api' | 'dismiss';
  /** 跳转路径或 API endpoint */
  target?: string;
}

/** SSE 事件类型（扩展 auth events 到多路复用） */
export type SseEventType =
  | 'auth.events'
  | 'notification.system'
  | 'notification.workflow'
  | 'notification.message'
  | 'notification.audit';

/** 通用 SSE 推送包（contentType 决定如何解析 data） */
export interface SseNotificationFrame {
  /** SSE 事件名 */
  event: SseEventType;
  /** 具体通知数据（JSON 字符串，按 event 类型解析） */
  data: string;
}

/**
 * 未读数状态（Pinia store 维护）。
 *
 * <p>各模块分别维护「模块维度未读」，通知中心聚合展示总数。
 */
export interface NotificationUnreadCounts {
  /** 系统通知未读 */
  system: number;
  /** 流程待办未读 */
  workflow: number;
  /** 消息未读 */
  message: number;
  /** 安全事件未读 */
  audit: number;
  /** 总数（派生计算） */
  total: number;
}
