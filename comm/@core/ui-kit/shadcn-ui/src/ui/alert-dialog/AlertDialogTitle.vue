<!--
 * 确认对话框的标题：radix 会将其注册为对话框的 aria-labelledby，
 * 因此本组件不可省略，否则读屏用户会听到一个无标题的对话框。
 *
 * 字号固定为 text-lg 并去掉行高（leading-none），
 * 以保证标题与下方说明文字之间的间距只由组件的布局类决定。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\alert-dialog\AlertDialogTitle.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { AlertDialogTitleProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@YDSZ-core/shared/utils';

import { AlertDialogTitle, useForwardProps } from 'radix-vue';

type ClassValue = string | Record<string, boolean> | (string | Record<string, boolean>)[];

const props = defineProps<AlertDialogTitleProps & { class?: ClassValue }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <AlertDialogTitle
    v-bind="forwardedProps"
    :class="
      cn('text-lg font-semibold leading-none tracking-tight', props.class)
    "
  >
    <slot></slot>
  </AlertDialogTitle>
</template>
