<!--
 * 卡片容器：提供统一的圆角、边框、阴影与背景。
 *
 * 纯展示容器，不包装 radix 组件；hoverable 开启时叠加悬停反馈，用于可点击的卡片。
 * 外部 class 一律经 cn 合并，避免调用方的圆角/内边距与默认样式同时生效、
 * 最后由 CSS 顺序决定胜负。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\card\Card.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { cn } from "@YDSZ-core/shared/utils";

type ClassValue = string | Record<string, boolean> | (string | Record<string, boolean>)[];

const props = defineProps<{
  class?: ClassValue;
  hoverable?: boolean;
}>();
</script>

<template>
  <div
    :class="
      cn(
        'bg-surface-2 text-card-foreground rounded-xl border border-border-subtle shadow-raised',
        hoverable && 'hover-card cursor-pointer',
        props.class,
      )
    "
  >
    <slot></slot>
  </div>
</template>
