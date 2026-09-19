<!--
 * Popover（popover）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { PopoverEmits, PopoverProps } from './popover-types';

defineOptions({ name: 'YdPopover' });

const props = withDefaults(defineProps<PopoverProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<PopoverEmits>();

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
  <div :class="[`yd-popover`, { 'yd-popover--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-popover {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-popover--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
