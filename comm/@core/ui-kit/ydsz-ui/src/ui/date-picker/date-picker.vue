<!--
 * DatePicker（date-picker）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { DatePickerEmits, DatePickerProps } from './date-picker-types';

defineOptions({ name: 'YdDatePicker' });

const props = withDefaults(defineProps<DatePickerProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<DatePickerEmits>();

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
  <div :class="[`yd-date-picker`, { 'yd-date-picker--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-date-picker {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-date-picker--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
