<!--
 * 对话框标题：作为无障碍标题关联到对话框本体。
 *
 * 会被 radix 用作 aria-labelledby 的目标，缺失会导致对话框对读屏「无标题」，
 * 因此建议始终渲染（需要隐藏可用 sr-only 类）。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\dialog\DialogTitle.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { DialogTitleProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@YDSZ-core/shared/utils';

import { DialogTitle, useForwardProps } from 'radix-vue';

type ClassValue = string | Record<string, boolean> | (string | Record<string, boolean>)[];

const props = defineProps<DialogTitleProps & { class?: ClassValue }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <DialogTitle
    v-bind="forwardedProps"
    :class="
      cn('text-lg font-semibold leading-none tracking-tight', props.class)
    "
  >
    <slot></slot>
  </DialogTitle>
</template>
