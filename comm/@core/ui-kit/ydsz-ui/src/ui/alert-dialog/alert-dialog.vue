<!--
 * AlertDialog（alert-dialog）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { AlertDialogEmits, AlertDialogProps } from './alert-dialog-types';

defineOptions({ name: 'YdAlertDialog' });

const props = withDefaults(defineProps<AlertDialogProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<AlertDialogEmits>();

function handleConfirm() {
  emit('confirm');
  emit('update:open', false);
}

function handleCancel() {
  emit('cancel');
  emit('update:open', false);
}
</script>

<template>
  <div :class="[`yd-alert-dialog`, { 'yd-alert-dialog--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-alert-dialog {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-alert-dialog--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
