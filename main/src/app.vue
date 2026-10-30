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
 * - 新增全局 LoadingProvider（请求计数器 + 防闪烁 debounce）
 *
 * @path main\src\app.vue
 * @since 5.2.0
-->
<script lang="ts" setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';

import { YdLoading } from '@ydsz-core/ydsz-ui';
import { ToastProvider } from '@ydsz/notification';
import { useLoadingStore } from '@ydsz/stores';

import ErrorBoundary from '#/components/error-boundary.vue';
import GlobalSearch from '#/components/global-search.vue';
import NetworkAlert from '#/components/network-alert.vue';
import SubAppProgress from '#/components/subapp-progress.vue';
import { useGlobalSearch } from '#/hooks/use-global-search';
import { preferences } from '@ydsz/preferences';
import { registerKeyboard } from '#/hooks/use-global-shortcut';

defineOptions({ name: 'App' });

const searchVisible = ref(false);
const { items: searchItems, appNameLabels } = useGlobalSearch();

// v4.0: 通过快捷键中枢注册 cmd+k（统一管理，自动冲突检测）
let stopSearchShortcut: (() => void) | undefined;
onMounted(() => {
  stopSearchShortcut = registerKeyboard('cmd+k', (e) => {
    e.preventDefault();
    searchVisible.value = !searchVisible.value;
  });
});
onUnmounted(() => { stopSearchShortcut?.(); });

// --- 全局 LoadingProvider（带防闪烁 debounce） ---
const loadingStore = useLoadingStore();

/** 防闪烁：loading 实际展示的 debounce 状态 */
const showLoading = ref(false);

/** loadingShowDelay(ms)：请求发起后至少等待这么久才展示遮罩，避免短请求闪烁 */
const loadingShowDelay = 200;
/** loadingHideDelay(ms)：请求结束后延迟隐藏，给连续请求留出切换缓冲 */
const loadingHideDelay = 100;

let showTimer: ReturnType<typeof setTimeout> | undefined;
let hideTimer: ReturnType<typeof setTimeout> | undefined;

watch(
  () => loadingStore.isLoading,
  (isLoading) => {
    if (isLoading) {
      // 取消任何进行中的隐藏定时器
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = undefined;
      }
      // 仅当 showLoading 尚未开启时才设置 delay 定时器
      if (!showLoading.value && !showTimer) {
        showTimer = setTimeout(() => {
          showLoading.value = true;
          showTimer = undefined;
        }, loadingShowDelay);
      }
    } else {
      // 取消任何进行中的展示定时器（请求在 showDelay 内已完成）
      if (showTimer) {
        clearTimeout(showTimer);
        showTimer = undefined;
      }
      // 延迟隐藏
      if (!hideTimer) {
        hideTimer = setTimeout(() => {
          showLoading.value = false;
          hideTimer = undefined;
        }, loadingHideDelay);
      }
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  if (showTimer) clearTimeout(showTimer);
  if (hideTimer) clearTimeout(hideTimer);
});
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
    <GlobalSearch
      v-model:visible="searchVisible"
      :app-name-labels="appNameLabels"
      :items="searchItems"
    />
  </ErrorBoundary>
  <!-- 全局 loading overlay：请求进行中时展示，防闪烁 debounce 控制 -->
  <YdLoading
    v-if="showLoading"
    class="fixed inset-0 z-[9999]"
    :spinning="true"
  />
</template>
