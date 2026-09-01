<!--
 * 手风琴的单条目：转发 radix AccordionItem 的 value / disabled 等属性，并统一加下分隔线。
 *
 * 分隔线固定在条目底部（border-b）而非顶部，
 * 这样最后一个条目下方也有一条线，视觉上与紧随其后的内容分区。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\accordion\AccordionItem.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { AccordionItemProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@YDSZ-core/shared/utils';

import { AccordionItem, useForwardProps } from 'radix-vue';

type ClassValue = string | Record<string, boolean> | (string | Record<string, boolean>)[];

const props = defineProps<AccordionItemProps & { class?: ClassValue }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <AccordionItem v-bind="forwardedProps" :class="cn('border-b', props.class)">
    <slot></slot>
  </AccordionItem>
</template>
