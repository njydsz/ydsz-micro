<!--
 * Textarea（textarea）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { TextareaEmits, TextareaProps } from './textarea-types';

defineOptions({ name: 'YdTextarea' });

const props = withDefaults(defineProps<TextareaProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<TextareaEmits>();

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
  <div :class="[`yd-textarea`, { 'yd-textarea--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-textarea {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-textarea--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
