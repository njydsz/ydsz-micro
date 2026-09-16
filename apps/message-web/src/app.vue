<!--
 * 应用根组件
 *
 * @path apps\message-web\src\app.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>



import { ToastProvider } from '@ydsz/notification';

defineOptions({ name: 'App' });

</script>

<template>
  <ToastProvider />
  <RouterView />
</template>
