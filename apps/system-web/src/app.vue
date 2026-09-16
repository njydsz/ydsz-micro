<!--
 * 应用根组件
 *
 * @path apps\system-web\src\app.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>

import { onMounted } from 'vue';

import { usePreferences } from '#/composables/usePreferences';

import { ToastProvider } from '@ydsz/notification';

defineOptions({ name: 'App' });


/** 启动偏好持久化：从 localStorage 加载 + 后端异步同步 */
const { syncFromBackend } = usePreferences();
onMounted(() => {
  void syncFromBackend();
});
</script>

<template>
  <ToastProvider />
  <RouterView />
</template>
