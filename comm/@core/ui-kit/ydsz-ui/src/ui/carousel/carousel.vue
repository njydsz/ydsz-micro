<!--
 * Carousel（carousel）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { CarouselEmits, CarouselProps } from './carousel-types';

defineOptions({ name: 'YdCarousel' });

const props = withDefaults(defineProps<CarouselProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<CarouselEmits>();

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
  <div :class="[`yd-carousel`, { 'yd-carousel--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-carousel {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-carousel--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
