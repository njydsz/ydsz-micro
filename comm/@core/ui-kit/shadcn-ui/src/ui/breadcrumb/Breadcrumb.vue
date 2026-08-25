<!--
 * Breadcrumb Vue 组件
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\breadcrumb\Breadcrumb.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
type ClassValue = string | Record<string, boolean> | (string | Record<string, boolean>)[];

const props = defineProps<{
  class?: ClassValue;
}>();
</script>

<template>
  <nav :class="props.class" aria-label="breadcrumb" role="navigation">
    <slot></slot>
  </nav>
</template>
