<!--
 * Cascader（cascader）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { CascaderEmits, CascaderProps } from './cascader-types';

defineOptions({ name: 'YdCascader' });

const props = withDefaults(defineProps<CascaderProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<CascaderEmits>();

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
  <div :class="[`yd-cascader`, { 'yd-cascader--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-cascader {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-cascader--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
