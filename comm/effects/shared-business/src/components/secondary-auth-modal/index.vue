<!--
 * 二次身份验证弹窗组件 — 入口中转
 *
 * @path comm\effects\shared-business\src\components\secondary-auth-modal\index.vue
 * @author ydsz-team
 * @since 1.0.0
 -->
<script lang="ts" setup>
import YdSecondaryAuthModal from './YdSecondaryAuthModal.vue';

defineOptions({ name: 'YdSecondaryAuthModal' });
</script>

<template>
  <YdSecondaryAuthModal v-bind="$attrs" />
</template>
