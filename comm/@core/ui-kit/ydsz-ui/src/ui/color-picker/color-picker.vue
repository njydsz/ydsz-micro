<!--
 * ColorPicker（color-picker）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { ColorPickerEmits, ColorPickerProps } from './color-picker-types';

defineOptions({ name: 'YdColorPicker' });

const props = withDefaults(defineProps<ColorPickerProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<ColorPickerEmits>();

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
  <div :class="[`yd-color-picker`, { 'yd-color-picker--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-color-picker {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-color-picker--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
