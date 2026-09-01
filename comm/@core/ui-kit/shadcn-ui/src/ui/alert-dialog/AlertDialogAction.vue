<!--
 * 确认对话框的主操作按钮：语义上代表「确认执行」，radix 会在点击后自动关闭对话框。
 *
 * 这里不做样式封装，按钮外观由调用方套用 Button 组件并指定 variant 决定，
 * 以免高危操作的「确认」按钮与普通按钮在视觉上失去区分度。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\alert-dialog\AlertDialogAction.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { AlertDialogActionProps } from 'radix-vue';

import { AlertDialogAction } from 'radix-vue';

const props = defineProps<AlertDialogActionProps>();
</script>

<template>
  <AlertDialogAction v-bind="props">
    <slot></slot>
  </AlertDialogAction>
</template>
