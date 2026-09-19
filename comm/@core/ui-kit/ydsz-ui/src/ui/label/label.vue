<!--
 * Label（label）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { LabelEmits, LabelProps } from './label-types';

defineOptions({ name: 'YdLabel' });

const props = withDefaults(defineProps<LabelProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<LabelEmits>();

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
  <div :class="[`yd-label`, { 'yd-label--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-label--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
