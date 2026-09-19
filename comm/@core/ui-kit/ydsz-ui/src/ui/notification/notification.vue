<!--
 * Notification（notification）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { NotificationEmits, NotificationProps } from './notification-types';

defineOptions({ name: 'YdNotification' });

const props = withDefaults(defineProps<NotificationProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<NotificationEmits>();

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
  <div :class="[`yd-notification`, { 'yd-notification--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-notification {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-notification--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
