<!--
 * 404 兜底页 —— 路由未匹配时的回退视图。
 *
 * @path apps/generator-web/src/views/fallback/not-found.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 404 兜底视图。
 *
 * <p>当访问路径无法匹配任何已注册路由时，显示此占位页。
 */
defineOptions({ name: 'FallbackNotFound' });
</script>

<template>
  <div class="flex h-full items-center justify-center">
    <span class="text-lg">页面不存在</span>
  </div>
</template>
