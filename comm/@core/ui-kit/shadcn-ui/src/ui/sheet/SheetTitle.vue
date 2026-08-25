<!--
 * SheetTitle Vue 组件
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\sheet\SheetTitle.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { DialogTitleProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@YDSZ-core/shared/utils';

import { DialogTitle } from 'radix-vue';

type ClassValue = string | Record<string, boolean> | (string | Record<string, boolean>)[];

const props = defineProps<DialogTitleProps & { class?: ClassValue }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});
</script>

<template>
  <DialogTitle
    :class="cn('text-foreground font-medium', props.class)"
    v-bind="delegatedProps"
  >
    <slot></slot>
  </DialogTitle>
</template>
