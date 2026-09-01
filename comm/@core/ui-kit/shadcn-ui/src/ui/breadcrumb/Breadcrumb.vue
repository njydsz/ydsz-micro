<!--
 * 面包屑的语义容器：渲染为 nav 并固定带上 aria-label="breadcrumb"。
 *
 * 用 nav + 有序列表而不是一串 div，是为了让读屏软件能识别这是一条层级路径、
 * 并允许用户在读屏的「地标」列表里直接跳转到这里。
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
