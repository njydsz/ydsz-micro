<!--
 * Empty（empty）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { EmptyEmits, EmptyProps } from './empty-types';

defineOptions({ name: 'YdEmpty' });

const props = withDefaults(defineProps<EmptyProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<EmptyEmits>();

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
  <div :class="[`yd-empty`, { 'yd-empty--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-empty {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-empty--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
