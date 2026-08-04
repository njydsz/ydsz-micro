<!--
 * internal-error 页面组件
 *
 * @path main\src\views\_core\fallback\internal-error.vue
 * @author remi-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { Fallback } from '@remi/common-ui';

defineOptions({ name: 'Fallback500Demo' });
</script>

<template>
  <Fallback status="500" />
</template>
