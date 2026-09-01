<!--
 * 确认对话框的说明文字：补充标题之外的后果描述，使用弱化色以突出标题。
 *
 * 无障碍要点：radix 会把本组件的文本注册为对话框的 aria-describedby，
 * 因此即使视觉上可以省略，破坏性操作也应当提供说明，让读屏用户听懂后果。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\alert-dialog\AlertDialogDescription.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import type { AlertDialogDescriptionProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@YDSZ-core/shared/utils';

import { AlertDialogDescription, useForwardProps } from 'radix-vue';

type ClassValue = string | Record<string, boolean> | (string | Record<string, boolean>)[];

const props = defineProps<AlertDialogDescriptionProps & { class?: ClassValue }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <AlertDialogDescription
    v-bind="forwardedProps"
    :class="cn('text-muted-foreground text-sm', props.class)"
  >
    <slot></slot>
  </AlertDialogDescription>
</template>
