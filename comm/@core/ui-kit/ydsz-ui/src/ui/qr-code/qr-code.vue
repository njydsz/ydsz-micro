<!--
 * QrCode（qr-code）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { QrCodeEmits, QrCodeProps } from './qr-code-types';

defineOptions({ name: 'YdQrCode' });

const props = withDefaults(defineProps<QrCodeProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<QrCodeEmits>();

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
  <div :class="[`yd-qr-code`, { 'yd-qr-code--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-qr-code {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-qr-code--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
