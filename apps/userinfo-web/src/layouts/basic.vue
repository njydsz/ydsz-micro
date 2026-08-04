<!--
 * 用户中心基础布局 — 包含侧边栏、顶栏、水印等页面外壳
 *
 * @path apps\userinfo-web\src\layouts\basic.vue
 * @author remi-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { watch } from 'vue';

import { useWatermark } from '@remi/hooks';
import { preferences } from '@remi/preferences';
import { useUserStore } from '@remi/stores';

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
  <!-- 只渲染路由视图，不渲染布局 -->
  <RouterView />
</template>
