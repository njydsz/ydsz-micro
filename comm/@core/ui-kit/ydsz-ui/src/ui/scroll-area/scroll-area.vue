<!--
 * ScrollArea（scroll-area）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { ScrollAreaEmits, ScrollAreaProps } from './scroll-area-types';

defineOptions({ name: 'YdScrollArea' });

const props = withDefaults(defineProps<ScrollAreaProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<ScrollAreaEmits>();

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
  <div :class="[`yd-scroll-area`, { 'yd-scroll-area--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-scroll-area {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-scroll-area--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
