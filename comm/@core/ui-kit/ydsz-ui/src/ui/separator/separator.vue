<!--
 * Separator（separator）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { SeparatorEmits, SeparatorProps } from './separator-types';

defineOptions({ name: 'YdSeparator' });

const props = withDefaults(defineProps<SeparatorProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<SeparatorEmits>();

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
  <div :class="[`yd-separator`, { 'yd-separator--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-separator {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-separator--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
