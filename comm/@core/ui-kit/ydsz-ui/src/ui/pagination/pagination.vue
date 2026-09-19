<!--
 * Pagination（pagination）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { PaginationEmits, PaginationProps } from './pagination-types';

defineOptions({ name: 'YdPagination' });

const props = withDefaults(defineProps<PaginationProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<PaginationEmits>();

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
  <div :class="[`yd-pagination`, { 'yd-pagination--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-pagination {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-pagination--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
