<!--
 * 卡片底部区：承载操作按钮的容器。
 *
 * 与 CardContent 同样是 p-6 pt-0，让底部操作与正文保持同一水平内边距；
 * 容器只给排布，不对子元素样式做假设。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\card\CardFooter.vue
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
  <div :class="cn('flex items-center p-6 pt-0', props.class)">
    <slot></slot>
  </div>
</template>
