<!--
 * Card Vue 组件 - 现代化卡片样式
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\card\Card.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { cn } from "@YDSZ-core/shared/utils";

type ClassValue = string | Record<string, boolean> | (string | Record<string, boolean>)[];

const props = defineProps<{
  class?: ClassValue;
  hoverable?: boolean;
}>();
</script>

<template>
  <div
    :class="
      cn(
        'bg-surface-2 text-card-foreground rounded-xl border border-border-subtle shadow-raised',
        hoverable && 'hover-card cursor-pointer',
        props.class,
      )
    "
  >
    <slot></slot>
  </div>
</template>
