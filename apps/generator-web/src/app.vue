<!--
 * 应用根组件
 *
 * @path apps/generator-web/src/app.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { useElementPlusDesignTokens } from '@ydsz/hooks';

import { ElConfigProvider } from 'element-plus';
import { onMounted } from 'vue';

import { elementLocale } from '#/locales';
import { usePreferences } from '#/composables/usePreferences';

defineOptions({ name: 'App' });

useElementPlusDesignTokens();

/** 启动偏好持久化：从 localStorage 加载 + 后端异步同步 */
const { syncFromBackend } = usePreferences();
onMounted(() => {
  void syncFromBackend();
});
</script>

<template>
  <ElConfigProvider :locale="elementLocale">
    <RouterView />
  </ElConfigProvider>
</template>
