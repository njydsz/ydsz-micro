<!--
 * 对话框底部操作区：排布对话框的操作按钮。
 *
 * 窄屏下改为纵向反向排列（flex-col-reverse），让主操作位于最下方、更贴近拇指；
 * 宽屏恢复横向。该响应式行为内置于此，调用方无需额外处理。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\dialog\DialogFooter.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { cn } from '@YDSZ-core/shared/utils';

type ClassValue = string | Record<string, boolean> | (string | Record<string, boolean>)[];

const props = defineProps<{ class?: ClassValue }>();
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
