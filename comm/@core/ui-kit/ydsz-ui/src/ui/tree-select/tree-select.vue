<!--
 * TreeSelect（tree-select）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { TreeSelectEmits, TreeSelectProps } from './tree-select-types';

defineOptions({ name: 'YdTreeSelect' });

const props = withDefaults(defineProps<TreeSelectProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<TreeSelectEmits>();

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
  <div :class="[`yd-tree-select`, { 'yd-tree-select--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-tree-select {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-tree-select--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
