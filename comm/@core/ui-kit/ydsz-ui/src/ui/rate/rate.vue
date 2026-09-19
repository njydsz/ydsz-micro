<!--
 * Rate（rate）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { RateEmits, RateProps } from './rate-types';

defineOptions({ name: 'YdRate' });

const props = withDefaults(defineProps<RateProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<RateEmits>();

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
  <div :class="[`yd-rate`, { 'yd-rate--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-rate {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-rate--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
