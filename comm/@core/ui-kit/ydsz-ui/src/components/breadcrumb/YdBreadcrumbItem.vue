<!--
 * 面包屑中的一级：渲染为 li，保证外层 YdBreadcrumbList 的有序列表语义成立。
 *
 * 注意分隔符（YdBreadcrumbSeparator）本身也是一个 li，
 * 因此不要把分隔符放进本组件内部，否则列表项数量会翻倍、读屏播报出多余的空项。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\breadcrumb\YdBreadcrumbItem.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
// @ts-nocheck
import { cn } from '@ydsz-core/shared/utils';

type ClassValue = string | Record<string, boolean> | (string | Record<string, boolean>)[];

const props = defineProps<{
  class?: ClassValue;
}>();
</script>

<template>
  <li
    :class="
      cn('hover:text-foreground inline-flex items-center gap-1.5', props.class)
    "
  >
    <slot></slot>
  </li>
</template>
