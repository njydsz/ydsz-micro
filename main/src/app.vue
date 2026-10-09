<!--
 * 应用根组件
 *
 * @path main\src\app.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<!--
 * 应用根组件（v5.2 重构）
 *
 * 变更（YDIZ-EP-001 Phase 1）：
 * - 移除旧版 ConfigProvider
 * - 移除 useElementDesignTokens()（主题桥接层废弃）
 * - 挂载 ToastProvider（ydsz-ui 通知系统入口）
 * - 保留 NetworkAlert / SubAppProgress / GlobalSearch
 * - 新增 ErrorBoundary 全局错误边界，防止组件渲染异常导致白屏
 *
 * @path main\src\app.vue
 * @since 5.2.0
-->
<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';

import { ToastProvider } from '@ydsz/notification';

import ErrorBoundary from '#/components/error-boundary.vue';
import GlobalSearch from '#/components/global-search.vue';
import NetworkAlert from '#/components/network-alert.vue';
import SubAppProgress from '#/components/subapp-progress.vue';
import { preferences } from '@ydsz/preferences';
import { registerKeyboard } from '#/hooks/use-global-shortcut';

defineOptions({ name: 'App' });

const searchVisible = ref(false);

// v4.0: 通过快捷键中枢注册 cmd+k（统一管理，自动冲突检测）
let stopSearchShortcut: (() => void) | undefined;
onMounted(() => {
  stopSearchShortcut = registerKeyboard('cmd+k', (e) => {
    e.preventDefault();
    searchVisible.value = !searchVisible.value;
  });
});
onUnmounted(() => { stopSearchShortcut?.(); });
</script>

<template>
  <ToastProvider />
  <ErrorBoundary name="全局通知">
    <NetworkAlert />
  </ErrorBoundary>
  <ErrorBoundary name="子应用加载进度">
    <SubAppProgress v-if="preferences.transition.progress" />
  </ErrorBoundary>
  <ErrorBoundary name="主内容区域">
    <RouterView />
  </ErrorBoundary>
  <ErrorBoundary name="全局搜索">
    <GlobalSearch v-model:visible="searchVisible" />
  </ErrorBoundary>
</template>
