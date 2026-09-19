<!--
 * Calendar（calendar）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { CalendarEmits, CalendarProps } from './calendar-types';

defineOptions({ name: 'YdCalendar' });

const props = withDefaults(defineProps<CalendarProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<CalendarEmits>();

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
  <div :class="[`yd-calendar`, { 'yd-calendar--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-calendar {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-calendar--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
