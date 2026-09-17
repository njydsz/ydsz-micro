<!--
 * 应用根组件
 *
 * @path main\src\app.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<!--
 * 应用根组件（v5.0 重构）
 *
 * 变更（YDIZ-EP-001 Phase 1）：
 * - 移除 ElConfigProvider（Element Plus 退出基座）
 * - 移除 useElementPlusDesignTokens()（EP 主题桥接层废弃）
 * - 挂载 ToastProvider（ydsz-ui 通知系统入口）
 * - 保留 NetworkAlert / SubAppProgress / GlobalSearch
 *
 * @path main\src\app.vue
 * @since 5.0.0
-->
<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';

import { ToastProvider } from '@ydsz/notification';

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
  <NetworkAlert />
  <SubAppProgress v-if="preferences.transition.progress" />
  <RouterView />
  <GlobalSearch v-model:visible="searchVisible" />
</template>
