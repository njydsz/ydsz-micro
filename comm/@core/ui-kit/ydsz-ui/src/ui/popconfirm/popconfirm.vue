<!--
 * Popconfirm（popconfirm）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { PopconfirmEmits, PopconfirmProps } from './popconfirm-types';

defineOptions({ name: 'YdPopconfirm' });

const props = withDefaults(defineProps<PopconfirmProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<PopconfirmEmits>();

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
  <div :class="[`yd-popconfirm`, { 'yd-popconfirm--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-popconfirm {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-popconfirm--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
