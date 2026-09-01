<!--
 * 面包屑的当前页：渲染为 span 并标记 aria-current="page"，不是链接。
 *
 * 使用弱化主色而非高亮色，让视觉焦点落在其祖先层级上；
 * role=link 配合 aria-disabled 是刻意的组合 —— 保留「这里本可以点击」的语义，
 * 又明确告知辅助技术当前页不可跳转。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\breadcrumb\BreadcrumbPage.vue
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
  <span
    :class="cn('text-foreground font-normal', props.class)"
    aria-current="page"
    aria-disabled="true"
    role="link"
  >
    <slot></slot>
  </span>
</template>
