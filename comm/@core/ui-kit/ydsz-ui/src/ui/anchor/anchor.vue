<!--
 * Anchor（anchor）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { AnchorEmits, AnchorProps } from './anchor-types';

defineOptions({ name: 'YdAnchor' });

const props = withDefaults(defineProps<AnchorProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<AnchorEmits>();

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
  <div :class="[`yd-anchor`, { 'yd-anchor--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-anchor {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-anchor--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
