<!--
 * Button（button）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { ButtonEmits, ButtonProps } from './button-types';

defineOptions({ name: 'YdButton' });

const props = withDefaults(defineProps<ButtonProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<ButtonEmits>();

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
  <div :class="[`yd-button`, { 'yd-button--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-button--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
