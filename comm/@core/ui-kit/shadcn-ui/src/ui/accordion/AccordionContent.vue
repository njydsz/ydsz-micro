<!--
 * 手风琴展开区：承载 radix 的展开/收起高度动画，内容再包一层 div 承载内边距。
 *
 * 内边距放在内层 div 而不是内容容器本身，是因为高度动画需要容器高度可从 0 平滑过渡；
 * 若把 padding 加在动画容器上，收起时会残留 padding 高度，出现「收不干净」的抖动。
 * class 先从 props 中剥离再合并，避免覆盖动画所需的原子类。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\accordion\AccordionContent.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { AccordionContentProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@YDSZ-core/shared/utils';

import { AccordionContent } from 'radix-vue';

type ClassValue = string | Record<string, boolean> | (string | Record<string, boolean>)[];

const props = defineProps<AccordionContentProps & { class?: ClassValue }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});
</script>

<template>
  <AccordionContent
    v-bind="delegatedProps"
    class="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm"
  >
    <div :class="cn('pb-4 pt-0', props.class)">
      <slot></slot>
    </div>
  </AccordionContent>
</template>
