<!--
 * ContextMenu（context-menu）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { ContextMenuEmits, ContextMenuProps } from './context-menu-types';

defineOptions({ name: 'YdContextMenu' });

const props = withDefaults(defineProps<ContextMenuProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<ContextMenuEmits>();

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
  <div :class="[`yd-context-menu`, { 'yd-context-menu--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-context-menu {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-context-menu--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
