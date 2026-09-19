<!--
 * Card（card）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { CardEmits, CardProps } from './card-types';

defineOptions({ name: 'YdCard' });

const props = withDefaults(defineProps<CardProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<CardEmits>();

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
  <div :class="[`yd-card`, { 'yd-card--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-card {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-card--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
