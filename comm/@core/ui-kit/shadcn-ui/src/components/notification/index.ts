/**
 * 通知中心的出口：铃铛入口（YdNotificationBell）与通知面板（YdNotificationPanel）。
 *
 * 两者成对使用：铃铛负责未读计数与点击开合，面板负责列表与已读操作，
 * 未读数在铃铛侧展示，因此面板不导出任何计数相关的状态。
 *
 * @path comm/@core/ui-kit/shadcn-ui/src/components/notification/index.ts
 * @author ydsz-team
 * @since 4.1.0 (P2-15)
 */

export { default as YdNotificationBell } from './notification-bell.vue';
export { default as YdNotificationPanel } from './notification-panel.vue';
