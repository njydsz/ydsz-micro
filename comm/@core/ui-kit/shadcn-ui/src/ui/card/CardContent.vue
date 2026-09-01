<!--
 * 卡片内容区：承载正文的容器。
 *
 * 上内边距置 0（p-6 pt-0）是因为它通常紧跟在 CardHeader 之后，
 * 由 Header 已有的下间距提供分隔，避免两处间距叠加。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\card\CardContent.vue
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
  <div :class="cn('p-6 pt-0', props.class)">
    <slot></slot>
  </div>
</template>
