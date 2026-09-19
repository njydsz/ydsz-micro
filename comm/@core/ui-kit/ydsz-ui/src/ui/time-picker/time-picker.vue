<!--
 * TimePicker（time-picker）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { TimePickerEmits, TimePickerProps } from './time-picker-types';

defineOptions({ name: 'YdTimePicker' });

const props = withDefaults(defineProps<TimePickerProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<TimePickerEmits>();

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
  <div :class="[`yd-time-picker`, { 'yd-time-picker--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-time-picker {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-time-picker--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
