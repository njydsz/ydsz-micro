<!--
 * ToggleGroup（toggle-group）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { ToggleGroupEmits, ToggleGroupProps } from './toggle-group-types';

defineOptions({ name: 'YdToggleGroup' });

const props = withDefaults(defineProps<ToggleGroupProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<ToggleGroupEmits>();

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
  <div :class="[`yd-toggle-group`, { 'yd-toggle-group--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-toggle-group {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-toggle-group--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
