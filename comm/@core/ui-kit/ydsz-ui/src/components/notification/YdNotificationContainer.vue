<!--
 * Notification 全局容器：按 position 分组渲染 YdNotification 子项。
 *
 * 作为 Notification 浮层命令式 API 的显示层，消费 useNotification 注入的 messages，
 * 将 NotificationMessage 按 position 分为六组，绝对定位于视口对应角落。
 * 新消息插入每组顶部（最新在上）。
 *
 * 用法：
 * ```vue
 * <YdNotificationContainer :messages="notification.messages.value" />
 * ```
 *
 * 不传 messages 时直接读取全局单例；
 * 需要自定义条目渲染时用 #default 插槽覆盖。
 *
 * @path comm/@core/ui-kit/ydsz-ui/src/components/notification/YdNotificationContainer.vue
 * @author ydsz-team
 * @since 26.10.30
-->
<script lang="ts" setup>
import { computed } from 'vue';

import type {
  NotificationMessage,
  NotificationPosition,
} from './types';

import { useLocale } from '../../locale/useLocale';
import YdNotification from './YdNotification.vue';
import { messages as globalMessages } from './use-notification';

/* ============================================================ */
/* Props                                                          */
/* ============================================================ */

interface Props {
  /** 需要渲染的通知消息列表；不传则取全局单例 */
  messages?: NotificationMessage[];
  /** 挂载目标（Teleport to）；传 false 关闭 Teleport */
  appendTo?: 'body' | string | false;
  /** 覆盖浮层层级的 z-index；默认 9998（比 Drawer 9999 低 1） */
  zIndex?: number;
}

const props = withDefaults(defineProps<Props>(), {
  appendTo: 'body',
  messages: undefined,
  zIndex: 9998,
});

/* ============================================================ */
/* Emit                                                           */
/* ============================================================ */

const emit = defineEmits<{
  /** 关闭某条消息的请求 */
  close: [id: string];
}>();

const { t } = useLocale();

/* ============================================================ */
/* 数据源                                                         */
/* ============================================================ */

const sourceMessages = computed<NotificationMessage[]>(
  () => props.messages ?? globalMessages.value,
);

/* ============================================================ */
/* 分组                                                          */
/* ============================================================ */

const POSITIONS: NotificationPosition[] = [
  'top-right',
  'top-left',
  'bottom-right',
  'bottom-left',
  'top-center',
  'bottom-center',
];

const groupedMessages = computed<Record<NotificationPosition, NotificationMessage[]>>(() => {
  const groups = {} as Record<NotificationPosition, NotificationMessage[]>;
  for (const pos of POSITIONS) {
    groups[pos] = [];
  }
  for (const msg of sourceMessages.value) {
    if (groups[msg.position]) {
      groups[msg.position]!.push(msg);
    }
  }
  return groups;
});

/* ============================================================ */
/* 位置类名                                                       */
/* ============================================================ */

const positionClasses: Record<NotificationPosition, string> = {
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 flex-col-reverse',
  'bottom-left': 'bottom-4 left-4 flex-col-reverse',
  'bottom-right': 'bottom-4 right-4 flex-col-reverse',
  'top-center': 'top-4 left-1/2 -translate-x-1/2 flex-col',
  'top-left': 'top-4 left-4 flex-col',
  'top-right': 'top-4 right-4 flex-col',
};

const rootStyle = computed(() => ({ zIndex: String(props.zIndex) }));
</script>

<template>
  <Teleport
    :to="props.appendTo || 'body'"
    :disabled="props.appendTo === false"
  >
    <div
      class="pointer-events-none fixed inset-0 flex flex-col"
      :style="rootStyle"
      aria-atomic="false"
      aria-live="polite"
      :aria-label="t('notification.region')"
      role="region"
    >
      <TransitionGroup
        v-for="pos in POSITIONS"
        :key="pos"
        tag="div"
        :class="[
          'pointer-events-none fixed flex w-auto max-w-sm gap-3',
          positionClasses[pos],
        ]"
      >
        <div
          v-for="msg in groupedMessages[pos]"
          :key="msg.id"
          class="pointer-events-auto"
        >
          <slot
            :message="msg"
            :position="pos"
            name="default"
          >
            <YdNotification
              :id="msg.id"
              :description="msg.description"
              :duration="msg.duration"
              :icon="msg.icon"
              :message="msg.message"
              :show-icon="msg.showIcon"
              :type="msg.type"
              @close="emit('close', msg.id)"
            />
          </slot>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
