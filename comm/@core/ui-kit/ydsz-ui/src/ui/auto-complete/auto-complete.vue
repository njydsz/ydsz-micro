<!--
 * AutoComplete（auto-complete）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { AutoCompleteEmits, AutoCompleteProps } from './auto-complete-types';

defineOptions({ name: 'YdAutoComplete' });

const props = withDefaults(defineProps<AutoCompleteProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<AutoCompleteEmits>();

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
  <div :class="[`yd-auto-complete`, { 'yd-auto-complete--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-auto-complete {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-auto-complete--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
