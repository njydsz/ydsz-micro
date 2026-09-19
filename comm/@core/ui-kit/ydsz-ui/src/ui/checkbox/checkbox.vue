<!--
 * Checkbox（checkbox）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { CheckboxEmits, CheckboxProps } from './checkbox-types';

defineOptions({ name: 'YdCheckbox' });

const props = withDefaults(defineProps<CheckboxProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<CheckboxEmits>();

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
  <div :class="[`yd-checkbox`, { 'yd-checkbox--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-checkbox--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
