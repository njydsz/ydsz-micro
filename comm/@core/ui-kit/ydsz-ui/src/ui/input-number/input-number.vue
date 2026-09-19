<!--
 * InputNumber（input-number）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { InputNumberEmits, InputNumberProps } from './input-number-types';

defineOptions({ name: 'YdInputNumber' });

const props = withDefaults(defineProps<InputNumberProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<InputNumberEmits>();

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
  <div :class="[`yd-input-number`, { 'yd-input-number--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-input-number {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-input-number--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
