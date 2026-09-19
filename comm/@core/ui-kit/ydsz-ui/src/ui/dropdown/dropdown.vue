<!--
 * Dropdown（dropdown）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { DropdownEmits, DropdownProps } from './dropdown-types';

defineOptions({ name: 'YdDropdown' });

const props = withDefaults(defineProps<DropdownProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<DropdownEmits>();

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
  <div :class="[`yd-dropdown`, { 'yd-dropdown--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-dropdown {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-dropdown--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
