<!--
 * IconPicker（icon-picker）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { IconPickerEmits, IconPickerProps } from './icon-picker-types';

defineOptions({ name: 'YdIconPicker' });

const props = withDefaults(defineProps<IconPickerProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<IconPickerEmits>();

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
  <div :class="[`yd-icon-picker`, { 'yd-icon-picker--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-icon-picker {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-icon-picker--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
