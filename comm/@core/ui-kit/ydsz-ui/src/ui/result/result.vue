<!--
 * Result（result）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { ResultEmits, ResultProps } from './result-types';

defineOptions({ name: 'YdResult' });

const props = withDefaults(defineProps<ResultProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<ResultEmits>();

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
  <div :class="[`yd-result`, { 'yd-result--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-result {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-result--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
