<!--
 * Toggle（toggle）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { ToggleEmits, ToggleProps } from './toggle-types';

defineOptions({ name: 'YdToggle' });

const props = withDefaults(defineProps<ToggleProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<ToggleEmits>();

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
  <div :class="[`yd-toggle`, { 'yd-toggle--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-toggle--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
