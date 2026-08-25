<!--
 * CardTitle Vue 组件
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\card\CardTitle.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { cn } from '@YDSZ-core/shared/utils';

type ClassValue = string | Record<string, boolean> | (string | Record<string, boolean>)[];

const props = defineProps<{
  class?: ClassValue;
}>();
</script>

<template>
  <h3 :class="cn('font-semibold leading-none tracking-tight', props.class)">
    <slot></slot>
  </h3>
</template>
