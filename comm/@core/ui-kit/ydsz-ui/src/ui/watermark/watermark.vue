<!--
 * Watermark（watermark）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { WatermarkEmits, WatermarkProps } from './watermark-types';

defineOptions({ name: 'YdWatermark' });

const props = withDefaults(defineProps<WatermarkProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<WatermarkEmits>();

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
  <div :class="[`yd-watermark`, { 'yd-watermark--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-watermark {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-watermark--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
