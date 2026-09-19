<!--
 * Descriptions（descriptions）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { DescriptionsEmits, DescriptionsProps } from './descriptions-types';

defineOptions({ name: 'YdDescriptions' });

const props = withDefaults(defineProps<DescriptionsProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<DescriptionsEmits>();

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
  <div :class="[`yd-descriptions`, { 'yd-descriptions--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-descriptions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-descriptions--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
