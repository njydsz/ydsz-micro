<!--
 * 用户中心基础布局 — 包含侧边栏、顶栏、水印等页面外壳
 *
 * @path apps\userinfo-web\src\layouts\basic.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { watch } from 'vue';

import { ErrorBoundary, useWatermark } from '@ydsz/common-ui';
import { useI18n } from 'vue-i18n';
import { preferences } from '@ydsz/preferences';
import { useUserStore } from '@ydsz/stores';

const { t } = useI18n();
const userStore = useUserStore();
const { destroyWatermark, updateWatermark } = useWatermark();

watch(
  () => preferences.app.watermark,
  async (enable) => {
    if (enable) {
      await updateWatermark({
        content: `${userStore.userInfo?.username} - ${userStore.userInfo?.realName}`,
      });
    } else {
      destroyWatermark();
    }
  },
  {
    immediate: true,
  },
);
</script>

<template>
  <!-- ErrorBoundary 防止业务组件渲染异常导致白屏 -->
  <ErrorBoundary :show-retry="true" :error-message="t('error.pageLoadFailed')">
    <RouterView />
  </ErrorBoundary>
</template>
