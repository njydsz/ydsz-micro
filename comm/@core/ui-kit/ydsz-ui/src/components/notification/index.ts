/**
 * Notification 组件 barrel export。
 *
 * 提供：
 *  - YdNotification：单条通知卡片（自带 duration 自动关闭与悬停暂停）
 *  - TypeScript 类型：NotificationProps / NotificationType
 *
 * 典型用法：
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue';
 * import { YdNotification, type NotificationProps } from '@ydsz-core/ydsz-ui/notification';
 *
 * const items = ref<NotificationProps[]>([]);
 * </script>
 *
 * <template>
 *   <YdNotification
 *     v-for="item in items"
 *     :key="item.id"
 *     v-bind="item"
 *     @close="items = items.filter((n) => n.id !== item.id)"
 *   />
 * </template>
 * ```
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\notification\index.ts
 * @author ydsz-team
 * @since 5.7.0
 */

export { default as YdNotification } from './YdNotification.vue';
export type { NotificationProps, NotificationType } from './types';
