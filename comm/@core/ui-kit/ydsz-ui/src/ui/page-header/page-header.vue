<!--
 * PageHeader（page-header）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { PageHeaderEmits, PageHeaderProps } from './page-header-types';

defineOptions({ name: 'YdPageHeader' });

const props = withDefaults(defineProps<PageHeaderProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<PageHeaderEmits>();

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
  <div :class="[`yd-page-header`, { 'yd-page-header--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-page-header {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-page-header--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
