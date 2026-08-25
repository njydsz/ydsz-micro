<!--
 * BreadcrumbPage Vue 组件
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
