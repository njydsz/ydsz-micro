<!--
 * Badge（badge）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { BadgeEmits, BadgeProps } from './badge-types';

defineOptions({ name: 'YdBadge' });

const props = withDefaults(defineProps<BadgeProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<BadgeEmits>();

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
  <div :class="[`yd-badge`, { 'yd-badge--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-badge--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
