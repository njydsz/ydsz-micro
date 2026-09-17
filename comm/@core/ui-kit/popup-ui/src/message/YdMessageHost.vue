<!--
 * 消息提示的宿主席组件：订阅模块级消息列表，按类型优先级堆叠渲染在页面顶部。
 *
 * 本组件只在首次调用 ydszMessage 时由 message.ts 惰性挂载到 body，负责全部 toast
 * 的渲染与进出场动画，自身不持有业务状态，纯粹是模块单例的视图投影。
 *
 * @path comm\@core\ui-kit\popup-ui\src\message\YdMessageHost.vue
 * @author ydsz-team
 * @since 5.3.0
-->
<script lang="ts" setup>
import type { Ref } from 'vue';

import type { MessageItem, MessageType } from './message';

import { computed } from 'vue';

import {
  CircleAlert,
  CircleCheckBig,
  CircleX,
  Info,
  LoaderCircle,
  X,
} from '@ydsz-core/icons';
import { YdRenderContent } from '@ydsz-core/ydsz-ui';

/** 宿主席持有的消息列表（模块级 ref），由 message.ts 注入 */
const props = defineProps<{ messages: Ref<MessageItem[]> }>();

const emit = defineEmits<{ closeMessage: [id: string] }>();

defineOptions({ name: 'YdMessageHost' });

/** 非 loading 类型的语义图标与配色变量名映射 */
const SEMANTIC_ICON: Record<
  Exclude<MessageType, 'loading'>,
  { component: unknown; colorVar: string }
> = {
  info: { component: Info, colorVar: '--info' },
  success: { component: CircleCheckBig, colorVar: '--success' },
  warning: { component: CircleAlert, colorVar: '--warning' },
  error: { component: CircleX, colorVar: '--destructive' },
};

/** 过滤掉已进入退出动画的消息，避免 done 状态仍参与布局 */
const visibleMessages = computed(() =>
  props.messages.value.filter((item) => !item.leaving),
);
</script>
<template>
  <div
    class="pointer-events-none fixed left-1/2 top-3 z-[2000] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 flex-col items-center gap-2"
    aria-live="polite"
  >
    <TransitionGroup
      enter-active-class="transition duration-200 ease-out"
      leave-active-class="transition duration-150 ease-in"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-for="item in visibleMessages"
        :key="item.id"
        class="pointer-events-auto flex items-start gap-2 rounded-[var(--radius)] border bg-background px-3 py-2 shadow-lg"
        data-message-item
      >
        <LoaderCircle
          v-if="item.type === 'loading'"
          class="mt-0.5 size-4 shrink-0 animate-spin text-muted-foreground"
        />
        <component
          :is="
            item.type && item.type !== 'loading'
              ? SEMANTIC_ICON[item.type].component
              : null
          "
          v-show="item.showIcon !== false"
          v-else
          class="mt-0.5 size-4 shrink-0"
          :style="
            item.type && item.type !== 'loading'
              ? { color: `hsl(var(${SEMANTIC_ICON[item.type].colorVar}))` }
              : undefined
          "
        />
        <div class="min-w-0 flex-1 text-sm leading-5 text-foreground">
          <YdRenderContent :content="item.content" />
        </div>
        <button
          v-if="item.closable || item.duration === 0"
          type="button"
          aria-label="关闭消息"
          class="ml-1 shrink-0 text-muted-foreground opacity-60 transition hover:opacity-100"
          @click="emit('closeMessage', item.id)"
        >
          <X class="size-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>