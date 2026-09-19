<!--
 * Input（input）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { InputEmits, InputProps } from './input-types';

defineOptions({ name: 'YdInput' });

const props = withDefaults(defineProps<InputProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<InputEmits>();

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
  <div :class="[`yd-input`, { 'yd-input--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-input {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-input--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
