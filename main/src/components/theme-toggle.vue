<!--
 * 主题切换器包装组件 —— 在全局 Header 中嵌入，调用 ydsz-ui 的 YdThemeToggle。
 *
 * @path main\src\components\theme-toggle.vue
 * @author ydsz-team
 * @since 26.10.16
 -->
<script setup lang="ts">
/** 主题切换器包装：在全局 Header 中嵌入 */
import { YdThemeToggle } from '@ydsz-core/ydsz-ui';
</script>

<template>
  <YdThemeToggle />
</template>
