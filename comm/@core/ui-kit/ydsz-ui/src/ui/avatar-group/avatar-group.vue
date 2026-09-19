<!--
 * AvatarGroup（avatar-group）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { AvatarGroupEmits, AvatarGroupProps } from './avatar-group-types';

defineOptions({ name: 'YdAvatarGroup' });

const props = withDefaults(defineProps<AvatarGroupProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<AvatarGroupEmits>();

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
  <div :class="[`yd-avatar-group`, { 'yd-avatar-group--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-avatar-group {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-avatar-group--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
