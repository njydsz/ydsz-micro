<!--
 * Avatar（avatar）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { AvatarEmits, AvatarProps } from './avatar-types';

defineOptions({ name: 'YdAvatar' });

const props = withDefaults(defineProps<AvatarProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<AvatarEmits>();

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
  <div :class="[`yd-avatar`, { 'yd-avatar--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-avatar {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-avatar--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
