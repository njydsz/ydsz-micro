<!--
 * Table（table）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { TableEmits, TableProps } from './table-types';

defineOptions({ name: 'YdTable' });

const props = withDefaults(defineProps<TableProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<TableEmits>();

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
  <div :class="[`yd-table`, { 'yd-table--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-table {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-table--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
