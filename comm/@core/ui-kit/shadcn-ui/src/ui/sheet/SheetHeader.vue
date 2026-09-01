<!--
 * 抽屉顶部的标题区：纵向排布标题与说明，窄屏居中、宽屏左对齐。
 *
 * 居中到左对齐的断点与抽屉宽度（3/4 屏）相配合：
 * 窄屏下抽屉接近全屏，居中更有仪式感；宽屏下与正文左对齐更利于阅读。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\sheet\SheetHeader.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { cn } from '@YDSZ-core/shared/utils';

type ClassValue = string | Record<string, boolean> | (string | Record<string, boolean>)[];

const props = defineProps<{ class?: ClassValue }>();
</script>

<template>
  <div :class="cn('flex flex-col text-center sm:text-left', props.class)">
    <slot></slot>
  </div>
</template>
