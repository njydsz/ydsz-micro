<!--
 * 文字提示的容器：转发 radix TooltipRoot 的 props 与 emits。
 *
 * 延迟与方位分别在 TooltipProvider 与 TooltipContent 上配置，本组件只承载开合状态；
 * 它必须位于 TooltipProvider 之内，否则不会显示 ——
 * 这是接入 radix Tooltip 时最常见的疏漏。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\tooltip\Tooltip.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { TooltipRootEmits, TooltipRootProps } from 'radix-vue';

import { TooltipRoot, useForwardPropsEmits } from 'radix-vue';

const props = defineProps<TooltipRootProps>();
const emits = defineEmits<TooltipRootEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <TooltipRoot v-bind="forwarded">
    <slot></slot>
  </TooltipRoot>
</template>
