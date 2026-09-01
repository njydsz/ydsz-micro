<!--
 * 确认对话框的取消按钮：语义上代表「放弃本次操作」，radix 会据此关闭对话框并归还焦点。
 *
 * 无障碍要点：radix 在对话框打开时会把焦点限制在内容区内，
 * 初始焦点默认落在本按钮上 —— 对破坏性操作而言，这是更安全的默认值。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\alert-dialog\AlertDialogCancel.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { AlertDialogCancelProps } from 'radix-vue';

import { AlertDialogCancel } from 'radix-vue';

const props = defineProps<AlertDialogCancelProps>();
</script>

<template>
  <AlertDialogCancel v-bind="props">
    <slot></slot>
  </AlertDialogCancel>
</template>
