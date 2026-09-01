<!--
 * 抽屉底部的操作区：按钮右对齐，窄屏时反向竖排。
 *
 * flex-row + flex-col-reverse 的组合让「次要 / 主要」按 DOM 顺序书写、
 * 在窄屏下主要按钮落在下方（更靠近拇指），宽屏下则按视觉惯序排列，
 * 无需用 JS 判断断点重排。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\sheet\SheetFooter.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { cn } from '@YDSZ-core/shared/utils';

const props = defineProps<{ class?: any }>();
</script>

<template>
  <div
    :class="
      cn('flex flex-row flex-col-reverse justify-end gap-x-2', props.class)
    "
  >
    <slot></slot>
  </div>
</template>
