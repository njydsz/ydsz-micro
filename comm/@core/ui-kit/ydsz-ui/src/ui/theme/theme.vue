<!--
 * Theme（theme）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { ThemeEmits, ThemeProps } from './theme-types';

defineOptions({ name: 'YdTheme' });

const props = withDefaults(defineProps<ThemeProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<ThemeEmits>();

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
  <div :class="[`yd-theme`, { 'yd-theme--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-theme {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-theme--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
