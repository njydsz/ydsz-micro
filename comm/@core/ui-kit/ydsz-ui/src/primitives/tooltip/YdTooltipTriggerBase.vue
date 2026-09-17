<!--
 * YdTooltipTriggerBase —— 文字提示触发器（YdTooltipTrigger 别名）。
 *
 * 转发 radix YdTooltipTrigger 的 props，支持 asChild。
 * 功能与 YdTooltipTrigger 完全一致，提供「Base」命名导出保持命名惯例统一。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\tooltip\YdTooltipTriggerBase.vue
 * @author ydsz-team
 * @since 1.0.0
 */
<script setup lang="ts">
import type { TooltipTriggerProps } from 'radix-vue';

import { YdTooltipTrigger } from 'radix-vue';

const props = defineProps<TooltipTriggerProps>();
</script>

<template>
  <YdTooltipTrigger v-bind="props">
    <slot></slot>
  </YdTooltipTrigger>
</template>
