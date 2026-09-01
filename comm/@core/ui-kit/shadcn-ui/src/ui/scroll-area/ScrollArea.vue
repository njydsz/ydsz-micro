<!--
 * 自定义滚动区域的容器：组合 Root / Viewport / Corner，并对外暴露滚动事件。
 *
 * 同时提供 onScroll 与 viewportProps 两个入口：
 * 前者挂在根上，后者直接透传给 Viewport —— 真正的滚动事件来自 Viewport，
 * 要拿到 scrollTop 必须走 viewportProps，只监听根元素会什么都收不到。
 * onScroll 默认给一个空函数，避免调用方未传时 radix 收到 undefined 报错。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\scroll-area\ScrollArea.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { ScrollAreaRootProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@YDSZ-core/shared/utils';

import {
  ScrollAreaCorner,
  ScrollAreaRoot,
  ScrollAreaViewport,
} from 'radix-vue';

import ScrollBar from './ScrollBar.vue';

const props = withDefaults(
  defineProps<
    ScrollAreaRootProps & {
      class?: any;
      onScroll?: (event: Event) => void;
      viewportProps?: { onScroll: (event: Event) => void };
    }
  >(),
  {
    onScroll: () => {},
  },
);

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});
</script>

<template>
  <ScrollAreaRoot
    v-bind="delegatedProps"
    :class="cn('relative overflow-hidden', props.class)"
  >
    <ScrollAreaViewport
      as-child
      class="h-full w-full rounded-[inherit] focus:outline-none"
      @scroll="onScroll"
    >
      <slot></slot>
    </ScrollAreaViewport>
    <ScrollBar />
    <ScrollAreaCorner />
  </ScrollAreaRoot>
</template>
