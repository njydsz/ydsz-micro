<!--
 * Space（space）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { SpaceEmits, SpaceProps } from './space-types';

defineOptions({ name: 'YdSpace' });

const props = withDefaults(defineProps<SpaceProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<SpaceEmits>();

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
  <div :class="[`yd-space`, { 'yd-space--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-space {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-space--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
