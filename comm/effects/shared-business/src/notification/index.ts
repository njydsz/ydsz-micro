/**
 * 全局通知中心模块（P2-15）。
 *
 * @path comm/effects/shared-business/src/notification/index.ts
 * @author ydsz-team
 * @since 4.1.0
 */

export {
  useNotificationStore,
} from './notification-store';
export {
  setupSseNotificationBridge,
} from './sse-notification-bridge';
export {
  NotificationType,
} from './notification-types';
export type {
  NotificationAction,
  NotificationItem,
  NotificationPriority,
  NotificationUnreadCounts,
  SseEventType,
  SseNotificationFrame,
} from './notification-types';
