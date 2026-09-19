<!--
 * Link（link）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { LinkEmits, LinkProps } from './link-types';

defineOptions({ name: 'YdLink' });

const props = withDefaults(defineProps<LinkProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<LinkEmits>();

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
  <div :class="[`yd-link`, { 'yd-link--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-link--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
