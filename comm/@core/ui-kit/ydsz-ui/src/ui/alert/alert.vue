<!--
 * Alert（alert）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { AlertEmits, AlertProps } from './alert-types';

defineOptions({ name: 'YdAlert' });

const props = withDefaults(defineProps<AlertProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<AlertEmits>();

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
  <div :class="[`yd-alert`, { 'yd-alert--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-alert {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-alert--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
