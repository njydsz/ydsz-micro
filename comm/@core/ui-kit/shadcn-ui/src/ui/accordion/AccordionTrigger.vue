<!--
 * 手风琴标题按钮：内部固定包一层 AccordionHeader，
 * 因为 radix 要求触发器必须位于 heading 之内，否则标题层级语义不成立。
 *
 * 图标通过 data-state=open 做 180° 旋转（[&[data-state=open]>svg]:rotate-180），
 * 并留出 icon 插槽供调用方替换；未传插槽时回退到默认的 ChevronDown。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\accordion\AccordionTrigger.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { AccordionTriggerProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@YDSZ-core/shared/utils';

import { ChevronDown } from 'lucide-vue-next';
import { AccordionHeader, AccordionTrigger } from 'radix-vue';

type ClassValue = string | Record<string, boolean> | (string | Record<string, boolean>)[];

const props = defineProps<AccordionTriggerProps & { class?: ClassValue }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});
</script>

<template>
  <AccordionHeader class="flex">
    <AccordionTrigger
      v-bind="delegatedProps"
      :class="
        cn(
          'flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180',
          props.class,
        )
      "
    >
      <slot></slot>
      <slot name="icon">
        <ChevronDown
          class="text-muted-foreground h-4 w-4 shrink-0 transition-transform duration-200"
        />
      </slot>
    </AccordionTrigger>
  </AccordionHeader>
</template>
