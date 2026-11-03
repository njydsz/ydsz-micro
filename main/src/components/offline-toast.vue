<!--
 * 离线状态 Toast 提示组件
 *
 * 响应式监听网络状态变化，使用全局 Toast API 显示轻提示：
 * - 网络断开时：红色 toast "网络已断开，部分操作可能失败"
 * - 网络恢复时：绿色 toast "网络已恢复"
 *
 * 设计为无渲染组件（renderless），仅有逻辑无 UI，Toast 由全局 ToastProvider 渲染。
 * 在 App 根组件中挂载一次即可（<OfflineToast />）。
 *
 * @path main/src/components/offline-toast.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { onUnmounted, watch } from 'vue';

import { $t } from '@ydsz/locales';
import { showToast } from '@ydsz/notification';

import { useNetworkStatus } from '#/hooks/use-network-status';

const { networkStatus } = useNetworkStatus();

/** 上次网络状态（用于检测跳变） */
let wasOnline = networkStatus.value.isOnline;

/**
 * 监听网络状态跳变：
 * - online → offline：显示错误 toast（长停留 6s）
 * - offline → online：显示成功 toast（自动消失 3s）
 */
watch(
  () => networkStatus.value.isOnline,
  (isOnline: boolean) => {
    if (!isOnline && wasOnline) {
      // 网络断开
      showToast.error($t('page.networkAlert.offline') as string, { duration: 6000 });
    } else if (isOnline && !wasOnline) {
      // 网络恢复
      showToast.success($t('page.networkAlert.recovered') as string, { duration: 3000 });
    }
    wasOnline = isOnline;
  },
);

onUnmounted(() => {
  // 清理：无持久监听需要卸载（useNetworkStatus 内部单例共享）
});
</script>

<template>
  <!-- 无渲染组件：仅提供逻辑 -->
</template>
