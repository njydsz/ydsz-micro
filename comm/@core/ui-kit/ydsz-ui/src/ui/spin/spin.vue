<!--
 * Spin（spin）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { SpinEmits, SpinProps } from './spin-types';

defineOptions({ name: 'YdSpin' });

const props = withDefaults(defineProps<SpinProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<SpinEmits>();

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
  <div :class="[`yd-spin`, { 'yd-spin--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-spin {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-spin--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
