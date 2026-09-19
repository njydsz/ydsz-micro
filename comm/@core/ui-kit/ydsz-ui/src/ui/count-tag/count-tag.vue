<!--
 * CountTag（count-tag）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { CountTagEmits, CountTagProps } from './count-tag-types';

defineOptions({ name: 'YdCountTag' });

const props = withDefaults(defineProps<CountTagProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<CountTagEmits>();

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
  <div :class="[`yd-count-tag`, { 'yd-count-tag--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-count-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-count-tag--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
