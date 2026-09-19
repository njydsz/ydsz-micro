<!--
 * DropdownMenu（dropdown-menu）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { DropdownMenuEmits, DropdownMenuProps } from './dropdown-menu-types';

defineOptions({ name: 'YdDropdownMenu' });

const props = withDefaults(defineProps<DropdownMenuProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<DropdownMenuEmits>();

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
  <div :class="[`yd-dropdown-menu`, { 'yd-dropdown-menu--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-dropdown-menu {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-dropdown-menu--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
