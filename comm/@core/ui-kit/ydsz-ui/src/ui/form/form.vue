<!--
 * Form（form）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { FormEmits, FormProps } from './form-types';

defineOptions({ name: 'YdForm' });

const props = withDefaults(defineProps<FormProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<FormEmits>();

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
  <div :class="[`yd-form`, { 'yd-form--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-form {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-form--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
