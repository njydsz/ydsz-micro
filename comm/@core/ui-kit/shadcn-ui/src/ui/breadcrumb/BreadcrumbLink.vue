<!--
 * 面包屑中可点击的一级：默认渲染为 a，可通过 as / asChild 换成 RouterLink 等组件。
 *
 * 用 radix Primitive 而非硬编码 a 标签，是为了让面包屑能直接接入路由链接，
 * 同时保留 hover 过渡样式；只有当前页（BreadcrumbPage）才不使用本组件 —— 它没有跳转目标。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\breadcrumb\BreadcrumbLink.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import type { PrimitiveProps } from 'radix-vue';

import { cn } from '@YDSZ-core/shared/utils';

import { Primitive } from 'radix-vue';

type ClassValue = string | Record<string, boolean> | (string | Record<string, boolean>)[];

const props = withDefaults(defineProps<PrimitiveProps & { class?: ClassValue }>(), {
  as: 'a',
});
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :class="cn('hover:text-foreground transition-colors', props.class)"
  >
    <slot></slot>
  </Primitive>
</template>
