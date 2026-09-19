<!--
 * Dialog（dialog）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { DialogEmits, DialogProps } from './dialog-types';

defineOptions({ name: 'YdDialog' });

const props = withDefaults(defineProps<DialogProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<DialogEmits>();

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
  <div :class="[`yd-dialog`, { 'yd-dialog--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-dialog {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-dialog--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
