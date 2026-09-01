<!--
 * Tooltip 的组合封装：内部自带 TooltipProvider，因此调用方不必再手动包一层 Provider。
 *
 * 对外只暴露高频的四个入口：trigger 插槽承载触发元素、默认插槽承载浮层内容，
 * side 与 delayDuration 控制方位与延迟（默认 right / 0），
 * contentClass 与 contentStyle 用于在不改组件的前提下覆盖浮层外观。
 *
 * 注意 TooltipProvider 的 delayDuration 在 Provider 层生效，
 * 多个 tooltip 若需要不同延迟，应各自包一层本组件而非共享 Provider。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\components\tooltip\tooltip.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { TooltipContentProps } from 'radix-vue';

import type { StyleValue } from 'vue';

import type { ClassType } from '@YDSZ-core/typings';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../ui';

interface Props {
  contentClass?: ClassType;
  contentStyle?: StyleValue;
  delayDuration?: number;
  side?: TooltipContentProps['side'];
}

withDefaults(defineProps<Props>(), {
  delayDuration: 0,
  side: 'right',
});
</script>

<template>
  <TooltipProvider :delay-duration="delayDuration">
    <Tooltip>
      <TooltipTrigger as-child>
        <slot name="trigger"></slot>
      </TooltipTrigger>
      <TooltipContent
        :class="contentClass"
        :side="side"
        :style="contentStyle"
        class="side-content text-popover-foreground bg-accent rounded-md"
        role="tooltip"
      >
        <slot></slot>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>
