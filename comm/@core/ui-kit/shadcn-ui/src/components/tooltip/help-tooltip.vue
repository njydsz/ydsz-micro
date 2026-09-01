<!--
 * 「帮助说明」场景的固化用法：默认渲染一个 CircleHelp 问号图标作为触发器，
 * 外部可通过 trigger 插槽替换为任意元素。
 *
 * 关闭 inheritAttrs 是刻意为之 —— 避免上层透传的属性落到 tooltip 内容上，
 * 造成触发区与浮层样式互相污染。延迟固定为 300ms、方向固定为 right，
 * 让全站的帮助提示保持一致的手感。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\components\tooltip\help-tooltip.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { cn } from '@YDSZ-core/shared/utils';

import { CircleHelp } from 'lucide-vue-next';

import Tooltip from './tooltip.vue';

defineOptions({
  inheritAttrs: false,
});

defineProps<{ triggerClass?: string }>();
</script>

<template>
  <Tooltip :delay-duration="300" side="right">
    <template #trigger>
      <slot name="trigger">
        <CircleHelp
          :class="
            cn(
              'text-foreground/80 hover:text-foreground inline-flex size-5 cursor-pointer',
              triggerClass,
            )
          "
        />
      </slot>
    </template>
    <slot></slot>
  </Tooltip>
</template>
