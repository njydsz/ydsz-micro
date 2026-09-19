<!--
 * Accordion（accordion）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { AccordionEmits, AccordionProps } from './accordion-types';

defineOptions({ name: 'YdAccordion' });

const props = withDefaults(defineProps<AccordionProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<AccordionEmits>();

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
  <div :class="[`yd-accordion`, { 'yd-accordion--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-accordion {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-accordion--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
