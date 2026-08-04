<!--
 * offline 页面组件
 *
 * @path main\src\views\_core\fallback\offline.vue
 * @author remi-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { Fallback } from '@remi/common-ui';

defineOptions({ name: 'FallbackOfflineDemo' });
</script>

<template>
  <Fallback status="offline" />
</template>
