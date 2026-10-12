<!--
 * Toast 全局容器：按 position 分组渲染 YdToast 子项。
 *
 * 作为 Toast 的显示层，消费 useToast 注入的 messages，
 * 将 ToastMessage 按 position 分为六组，绝对定位于视口对应角落。
 * 新消息插入每组顶部（最新在上）。
 *
 * 用法：
 * ```vue
 * <YdToastContainer />
 * ```
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

/* ============================================================ */
/* Props                                                          */
/* ============================================================ */

interface Props {
  /** 需要渲染的 Toast 消息列表 */
  messages?: ToastMessage[];
}

const props = withDefaults(defineProps<Props>(), {
  messages: () => [],
});

/* ============================================================ */
/* Emit                                                           */
/* ============================================================ */

const emit = defineEmits<{
  /** 关闭某条消息的请求 */
  close: [id: string];
}>();

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
  for (const msg of props.messages ?? []) {
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

const positionLabel: Record<ToastPosition, string> = {
  'bottom-center': '底部居中',
  'bottom-left': '左下角',
  'bottom-right': '右下角',
  'top-center': '顶部居中',
  'top-left': '左上角',
  'top-right': '右上角',
};
</script>

<template>
  <div
    class="pointer-events-none fixed inset-0 z-[9999] flex flex-col"
    aria-hidden="false"
  >
    <template v-for="pos in POSITIONS" :key="pos">
      <TransitionGroup
        tag="div"
        :class="[
          'pointer-events-none fixed z-[9999] flex w-auto gap-2',
          positionClasses[pos],
        ]"
        :aria-label="`Toast 通知区域 — ${positionLabel[pos]}`"
        role="region"
      >
        <div v-for="msg in groupedMessages[pos]" :key="msg.id">
          <div class="pointer-events-auto">
            <!--
              通过 slot 暴露完整 msg 给父组件自定义渲染，
              若不使用 slot 则渲染默认 YdToast
            -->
            <slot :message="msg" :position="pos">
            </slot>
          </div>
        </div>
      </TransitionGroup>
    </template>
  </div>
</template>
