<!--
 * CardList（card-list）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { CardListEmits, CardListProps } from './card-list-types';

defineOptions({ name: 'YdCardList' });

const props = withDefaults(defineProps<CardListProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<CardListEmits>();

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
  <div :class="[`yd-card-list`, { 'yd-card-list--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-card-list {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-card-list--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
