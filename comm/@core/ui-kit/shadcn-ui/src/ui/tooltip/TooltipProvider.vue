<!--
 * 文字提示的全局提供者：统管一组 tooltip 的显示延迟与跳过策略。
 *
 * 延迟在 Provider 层生效而非单个 tooltip，
 * 是为了让「鼠标在同一区域连续划过多个提示」时不会逐个弹出；
 * 需要不同延迟的提示应各自包一层 Provider，而不是共享同一个。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\tooltip\TooltipProvider.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { TooltipProviderProps } from 'radix-vue';

import { TooltipProvider } from 'radix-vue';

const props = defineProps<TooltipProviderProps>();
</script>

<template>
  <TooltipProvider v-bind="props">
    <slot></slot>
  </TooltipProvider>
</template>
