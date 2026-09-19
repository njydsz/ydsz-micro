<!--
 * BackTop（back-top）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { BackTopEmits, BackTopProps } from './back-top-types';

defineOptions({ name: 'YdBackTop' });

const props = withDefaults(defineProps<BackTopProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<BackTopEmits>();

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
  <div :class="[`yd-back-top`, { 'yd-back-top--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-back-top {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-back-top--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
