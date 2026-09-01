<!--
 * 需要用户确认才能继续的模态对话框容器：转发 radix AlertDialogRoot 的全部 props 与 emits。
 *
 * 与 Dialog 的取舍：AlertDialog 强制要求显式点击 Action 或 Cancel 才会关闭，
 * 不允许点击遮罩或按 Esc 直接关闭，适用于删除、覆盖等高危操作。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\alert-dialog\AlertDialog.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { AlertDialogEmits, AlertDialogProps } from 'radix-vue';

import { AlertDialogRoot, useForwardPropsEmits } from 'radix-vue';

const props = defineProps<AlertDialogProps>();
const emits = defineEmits<AlertDialogEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <AlertDialogRoot v-bind="forwarded">
    <slot></slot>
  </AlertDialogRoot>
</template>
