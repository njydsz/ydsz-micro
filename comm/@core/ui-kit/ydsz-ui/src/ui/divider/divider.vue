<!--
 * Divider（divider）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { DividerEmits, DividerProps } from './divider-types';

defineOptions({ name: 'YdDivider' });

const props = withDefaults(defineProps<DividerProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<DividerEmits>();

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
  <div :class="[`yd-divider`, { 'yd-divider--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-divider {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-divider--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
