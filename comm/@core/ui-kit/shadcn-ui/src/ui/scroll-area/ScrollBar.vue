<!--
 * 滚动区域的滚动条：默认纵向，通过 orientation 切换横竖两套尺寸与内边距。
 *
 * 加 touch-none 是移动端的关键 —— 否则浏览器会把滚动条上的触摸判定为页面滚动手势，
 * 在触屏上完全拖不动；内边距 p-px 让滑轨与滑块之间留出 1px 间隙，避免糊成一条。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\scroll-area\ScrollBar.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { ScrollAreaScrollbarProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@YDSZ-core/shared/utils';

import { ScrollAreaScrollbar, ScrollAreaThumb } from 'radix-vue';

const props = withDefaults(
  defineProps<ScrollAreaScrollbarProps & { class?: any }>(),
  {
    orientation: 'vertical',
  },
);

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});
</script>

<template>
  <ScrollAreaScrollbar
    v-bind="delegatedProps"
    :class="
      cn(
        'flex touch-none select-none transition-colors',
        orientation === 'vertical' &&
          'h-full w-2.5 border-l border-l-transparent p-px',
        orientation === 'horizontal' &&
          'h-2.5 flex-col border-t border-t-transparent p-px',
        props.class,
      )
    "
  >
    <ScrollAreaThumb class="bg-border relative flex-1 rounded-full" />
  </ScrollAreaScrollbar>
</template>
