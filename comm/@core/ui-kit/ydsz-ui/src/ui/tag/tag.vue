<!--
 * Tag（tag）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { TagEmits, TagProps } from './tag-types';

defineOptions({ name: 'YdTag' });

const props = withDefaults(defineProps<TagProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<TagEmits>();

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
  <div :class="[`yd-tag`, { 'yd-tag--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-tag--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
