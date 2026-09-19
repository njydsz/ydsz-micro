<!--
 * Collapse（collapse）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { CollapseEmits, CollapseProps } from './collapse-types';

defineOptions({ name: 'YdCollapse' });

const props = withDefaults(defineProps<CollapseProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<CollapseEmits>();

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
  <div :class="[`yd-collapse`, { 'yd-collapse--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-collapse {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-collapse--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
