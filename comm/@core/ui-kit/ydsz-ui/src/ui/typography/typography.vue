<!--
 * Typography（typography）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { TypographyEmits, TypographyProps } from './typography-types';

defineOptions({ name: 'YdTypography' });

const props = withDefaults(defineProps<TypographyProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<TypographyEmits>();

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
  <div :class="[`yd-typography`, { 'yd-typography--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-typography {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-typography--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
