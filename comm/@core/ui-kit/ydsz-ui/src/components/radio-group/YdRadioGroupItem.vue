<!--
 * 单选按钮本体：内部固定渲染 RadioGroupIndicator 作为选中标记。
 *
 * 外观用 aspect-square + h-4 w-4 定尺而不是靠内容撑开，
 * 保证与 YdLabel 的基线对齐稳定；选中态由 radix 的 data-state 驱动，
 * 不通过 v-model 传递，因此多个选项之间不会出现「两个都选中」的中间态。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\radio-group\YdRadioGroupItem.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { RadioGroupItemProps } from '@ydsz-core/ydsz-vue';

import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import { Circle } from 'lucide-vue-next';
import {
  RadioGroupIndicator,
  YdRadioGroupItem,
  useForwardProps,
} from '@ydsz-core/ydsz-vue';

type ClassValue = string | Record<string, boolean> | (string | Record<string, boolean>)[];

const props = defineProps<RadioGroupItemProps & { class?: ClassValue }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <YdRadioGroupItem
    v-bind="forwardedProps"
    :class="
      cn(
        'border-primary text-primary focus-visible:ring-ring aspect-square h-4 w-4 rounded-full border shadow focus:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50',
        props.class,
      )
    "
  >
    <RadioGroupIndicator class="flex items-center justify-center">
      <Circle class="h-2.5 w-2.5 fill-current text-current" />
    </RadioGroupIndicator>
  </YdRadioGroupItem>
</template>
