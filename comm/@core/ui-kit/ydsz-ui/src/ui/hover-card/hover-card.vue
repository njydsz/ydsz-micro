<!--
 * HoverCard（hover-card）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { HoverCardEmits, HoverCardProps } from './hover-card-types';

defineOptions({ name: 'YdHoverCard' });

const props = withDefaults(defineProps<HoverCardProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<HoverCardEmits>();

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
  <div :class="[`yd-hover-card`, { 'yd-hover-card--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-hover-card {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-hover-card--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
