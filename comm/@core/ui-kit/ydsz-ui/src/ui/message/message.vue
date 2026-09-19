<!--
 * Message（message）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { MessageEmits, MessageProps } from './message-types';

defineOptions({ name: 'YdMessage' });

const props = withDefaults(defineProps<MessageProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<MessageEmits>();

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
  <div :class="[`yd-message`, { 'yd-message--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-message {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-message--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
