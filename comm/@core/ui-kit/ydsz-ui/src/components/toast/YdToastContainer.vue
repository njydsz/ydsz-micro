<!--
 * Toast 全局容器：按 position 分组渲染 YdToast 子项。
 *
 * 作为 Toast 的显示层，消费 useToast 注入的 messages，
 * 将 ToastMessage 按 position 分为六组，绝对定位于视口对应角落。
 * 新消息插入每组顶部（最新在上）。
 *
 * 用法：
 * ```vue
 * <YdToastContainer :messages="toast.messages.value" />
 * ```
 *
 * 不传 messages 时直接读取全局单例，最省事；
 * 需要自定义条目渲染时用 #default 插槽覆盖。
 *
 * 内置 Tailwind transition-group 类：淡入淡出 + 位移动画。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\toast\YdToastContainer.vue
 * @author ydsz-team
 * @since 26.10.11
-->
<script lang="ts" setup>
import { computed } from 'vue';

import type {
  ToastMessage,
  ToastPosition,
} from './types';

import { useLocale } from '../../locale/useLocale';
import YdToast from './YdToast.vue';
import { messages as globalMessages } from './use-toast';

/* ============================================================ */
/* Props                                                          */
/* ============================================================ */

interface Props {
  /** 需要渲染的 Toast 消息列表；不传则取全局单例 */
  messages?: ToastMessage[];
  /** 挂载目标（Teleport to）；传 false 关闭 Teleport，原地渲染 */
  appendTo?: 'body' | string | false;
  /** 覆盖浮层层级的 z-index；默认 9999，需高于抽屉与对话框 */
  zIndex?: number;
}

const props = withDefaults(defineProps<Props>(), {
  appendTo: 'body',
  messages: undefined,
  zIndex: 9999,
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
/* 数据源：优先使用 props.messages，缺省回落到全局单例                  */
/* ============================================================ */

const sourceMessages = computed<ToastMessage[]>(
  () => props.messages ?? globalMessages.value,
);

/* ============================================================ */
/* 分组：按 position 将 Toast 消息分桶                                  */
/* ============================================================ */

const POSITIONS: ToastPosition[] = [
  'top-right',
  'top-left',
  'bottom-right',
  'bottom-left',
  'top-center',
  'bottom-center',
];

const groupedMessages = computed<Record<ToastPosition, ToastMessage[]>>(() => {
  const groups = {} as Record<ToastPosition, ToastMessage[]>;
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
/* 位置类名（绝对定位）                                             */
/* ============================================================ */

const positionClasses: Record<ToastPosition, string> = {
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
      :aria-label="t('toast.region')"
      role="region"
    >
      <TransitionGroup
        v-for="pos in POSITIONS"
        :key="pos"
        tag="div"
        :class="[
          'pointer-events-none fixed flex w-auto gap-2',
          positionClasses[pos],
        ]"
      >
        <div
          v-for="msg in groupedMessages[pos]"
          :key="msg.id"
          class="pointer-events-auto"
        >
          <!--
            默认渲染 YdToast；#default 插槽可整体替换条目外观，
            插槽必须自己负责触发 close，否则该条消息不会离开队列。
          -->
          <slot
            :message="msg"
            :position="pos"
            name="default"
          >
            <YdToast
              :closable="msg.closable"
              :detail="msg.detail"
              :icon="msg.icon"
              :life="msg.life"
              :severity="msg.severity"
              :summary="msg.summary"
              @close="emit('close', msg.id)"
            />
          </slot>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
