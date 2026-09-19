<!--
 * RadioGroup（radio-group）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { RadioGroupEmits, RadioGroupProps } from './radio-group-types';

defineOptions({ name: 'YdRadioGroup' });

const props = withDefaults(defineProps<RadioGroupProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<RadioGroupEmits>();

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
  <div :class="[`yd-radio-group`, { 'yd-radio-group--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-radio-group {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-radio-group--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
