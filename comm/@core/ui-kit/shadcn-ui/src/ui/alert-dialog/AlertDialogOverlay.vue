<!--
 * AlertDialogOverlay Vue 组件
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\alert-dialog\AlertDialogOverlay.vue
 * @author remi-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { useScrollLock } from '@remi-core/composables';

useScrollLock();
</script>
<template>
  <div class="bg-overlay z-popup inset-0"></div>
</template>
