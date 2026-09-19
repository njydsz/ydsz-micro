<!--
 * Splitter（splitter）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { SplitterEmits, SplitterProps } from './splitter-types';

defineOptions({ name: 'YdSplitter' });

const props = withDefaults(defineProps<SplitterProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<SplitterEmits>();

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
  <div :class="[`yd-splitter`, { 'yd-splitter--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-splitter {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-splitter--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
