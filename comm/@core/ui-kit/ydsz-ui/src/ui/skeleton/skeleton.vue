<!--
 * Skeleton（skeleton）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { SkeletonEmits, SkeletonProps } from './skeleton-types';

defineOptions({ name: 'YdSkeleton' });

const props = withDefaults(defineProps<SkeletonProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<SkeletonEmits>();

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
  <div :class="[`yd-skeleton`, { 'yd-skeleton--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-skeleton {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-skeleton--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
