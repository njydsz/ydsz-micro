<!--
 * BulkActions（bulk-actions）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { BulkActionsEmits, BulkActionsProps } from './bulk-actions-types';

defineOptions({ name: 'YdBulkActions' });

const props = withDefaults(defineProps<BulkActionsProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<BulkActionsEmits>();

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
  <div :class="[`yd-bulk-actions`, { 'yd-bulk-actions--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-bulk-actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-bulk-actions--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
