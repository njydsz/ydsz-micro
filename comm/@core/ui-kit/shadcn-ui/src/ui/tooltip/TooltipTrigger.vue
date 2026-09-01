<!--
 * 文字提示的触发器：转发 radix TooltipTrigger 的 props，支持 asChild。
 *
 * 不带样式，触发区形态由调用方决定；
 * 提示文本放在 TooltipContent 里而不是这里，避免污染可访问名称。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\tooltip\TooltipTrigger.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { TooltipTriggerProps } from 'radix-vue';

import { TooltipTrigger } from 'radix-vue';

const props = defineProps<TooltipTriggerProps>();
</script>

<template>
  <TooltipTrigger v-bind="props">
    <slot></slot>
  </TooltipTrigger>
</template>
