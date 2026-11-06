<!--
 * YdSubAppLayout —— 子应用路由视图的基础外壳
 *
 * <p>统一负责水印状态同步与 Vue 错误边界，避免各子应用重复实现。
 * 需要扩展移动导航、悬浮入口等应用专属内容时，可通过默认插槽叠加。
 *
 * @path comm\effects\shared-business\src\components\YdSubAppLayout.vue
 * @author ydzs-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { watch } from 'vue';

import { YdErrorBoundary, useWatermark } from '@ydsz/common-ui';
import { $t } from '@ydsz/locales';
import { preferences } from '@ydsz-core/preferences';
import { useUserStore } from '@ydsz/stores';

defineOptions({ name: 'YdSubAppLayout' });

const userStore = useUserStore();
const { destroyWatermark, updateWatermark } = useWatermark();

watch(
  [
    () => preferences.app.watermark,
    () => userStore.userInfo?.username,
    () => userStore.userInfo?.realName,
  ],
  async ([enable, username, realName]) => {
    if (!enable) {
      destroyWatermark();
      return;
    }

    await updateWatermark({
      content: `${username ?? ''} - ${realName ?? ''}`,
    });
  },
  { immediate: true },
);
</script>

<template>
  <YdErrorBoundary :error-message="$t('error.pageLoadFailed')" :show-retry="true">
    <RouterView />
    <slot />
  </YdErrorBoundary>
</template>
