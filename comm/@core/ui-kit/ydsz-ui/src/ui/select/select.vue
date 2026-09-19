<!--
 * Select（select）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { SelectEmits, SelectProps } from './select-types';

defineOptions({ name: 'YdSelect' });

const props = withDefaults(defineProps<SelectProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<SelectEmits>();

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
  <div :class="[`yd-select`, { 'yd-select--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-select {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-select--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
