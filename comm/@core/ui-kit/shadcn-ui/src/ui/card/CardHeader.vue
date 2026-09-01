<!--
 * 卡片头部区：容纳标题与描述的纵向排布容器。
 *
 * 用 flex 纵向布局加固定间距，让标题与描述的间距不依赖具体元素的 margin，
 * 缺任一项时也不会留下多余空白。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\card\CardHeader.vue
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
  <div :class="cn('flex flex-col gap-y-1.5 p-5', props.class)">
    <slot></slot>
  </div>
</template>
