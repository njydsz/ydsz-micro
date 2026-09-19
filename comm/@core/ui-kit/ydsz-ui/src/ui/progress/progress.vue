<!--
 * Progress（progress）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { ProgressEmits, ProgressProps } from './progress-types';

defineOptions({ name: 'YdProgress' });

const props = withDefaults(defineProps<ProgressProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<ProgressEmits>();

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
  <div :class="[`yd-progress`, { 'yd-progress--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-progress {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-progress--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
