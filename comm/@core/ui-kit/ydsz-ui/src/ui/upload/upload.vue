<!--
 * Upload（upload）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { UploadEmits, UploadProps } from './upload-types';

defineOptions({ name: 'YdUpload' });

const props = withDefaults(defineProps<UploadProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<UploadEmits>();

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
  <div :class="[`yd-upload`, { 'yd-upload--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-upload {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-upload--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
