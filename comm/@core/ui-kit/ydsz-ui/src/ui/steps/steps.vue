<!--
 * Steps（steps）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { StepsEmits, StepsProps } from './steps-types';

defineOptions({ name: 'YdSteps' });

const props = withDefaults(defineProps<StepsProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<StepsEmits>();

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
  <div :class="[`yd-steps`, { 'yd-steps--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-steps {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-steps--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
