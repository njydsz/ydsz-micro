<!--
 * 应用根组件
 *
 * @path apps\userinfo-web\src\app.vue
 * @author remi-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { useElementPlusDesignTokens } from '@remi/hooks';

import { ElConfigProvider } from 'element-plus';

import { elementLocale } from '#/locales';

defineOptions({ name: 'App' });

useElementPlusDesignTokens();
</script>

<template>
  <ElConfigProvider :locale="elementLocale">
    <RouterView />
  </ElConfigProvider>
</template>
