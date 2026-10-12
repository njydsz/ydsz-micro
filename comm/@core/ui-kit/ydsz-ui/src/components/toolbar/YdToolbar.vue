<script setup lang="ts">
import { cn } from '@ydsz-core/shared/utils';

interface Props {
  class?: any;
  /** 方向 */
  direction?: 'horizontal' | 'vertical';
}

withDefaults(defineProps<Props>(), {
  direction: 'horizontal',
});
</script>

<template>
  <div
    :class="
      cn(
        'bg-muted/30 flex items-center gap-1 rounded-md border p-1',
        props.direction === 'vertical' && 'flex-col',
        props.class,
      )
    "
    role="toolbar"
  >
    <slot></slot>
  </div>
</template>
