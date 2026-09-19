<!--
 * NumberField（number-field）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { NumberFieldEmits, NumberFieldProps } from './number-field-types';

defineOptions({ name: 'YdNumberField' });

const props = withDefaults(defineProps<NumberFieldProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<NumberFieldEmits>();

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
  <div :class="[`yd-number-field`, { 'yd-number-field--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-number-field {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-number-field--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
