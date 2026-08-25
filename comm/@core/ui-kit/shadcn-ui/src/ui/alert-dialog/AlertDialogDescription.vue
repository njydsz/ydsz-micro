<!--
 * AlertDialogDescription Vue 组件
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
