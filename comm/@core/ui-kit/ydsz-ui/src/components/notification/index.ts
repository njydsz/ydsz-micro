/**
 * Notification 组件 barrel —— 声明式组件 + 命令式 API 统一出口。
 *
 * 提供：
 *  - YdNotification：单条通知卡片（标题 + 描述 + 级别图标）
 *  - YdNotificationContainer：全局浮层容器（按 position 分组渲染）
 *  - useNotification：命令式 API（add / success / info / warning / error / update / remove / removeAll）
 *  - configureNotification：覆写全局默认时长 / 位置 / 最大可见数
 *
 * 典型用法：
 * ```vue
 * <script setup lang="ts">
 * import { useNotification, YdNotificationContainer } from '@ydsz-core/ydsz-ui';
 *
 * const notification = useNotification();
 * notification.success('保存成功');
 * notification.error('网络异常', { description: '请稍后重试', duration: 0 });
 * </script>
 *
 * <template>
 *   <YdNotificationContainer />
 * </template>
 * ```
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\notification\index.ts
 * @author ydsz-team
 * @since 5.7.0
 */

export { default as YdNotification } from './YdNotification.vue';
export { default as YdNotificationContainer } from './YdNotificationContainer.vue';
export { configureNotification, messages, useNotification } from './use-notification';

export type {
  NotificationConfig,
  NotificationHandle,
  NotificationMessage,
  NotificationOptions,
  NotificationPosition,
  NotificationProps,
  NotificationType,
  UseNotificationReturn,
} from './types';
