<!--
 * 面包屑中的一级：渲染为 li，保证外层 BreadcrumbList 的有序列表语义成立。
 *
 * 注意分隔符（BreadcrumbSeparator）本身也是一个 li，
 * 因此不要把分隔符放进本组件内部，否则列表项数量会翻倍、读屏播报出多余的空项。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\breadcrumb\BreadcrumbItem.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { cn } from '@YDSZ-core/shared/utils';

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
