<!--
 * Countdown（countdown）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { CountdownEmits, CountdownProps } from './countdown-types';

defineOptions({ name: 'YdCountdown' });

const props = withDefaults(defineProps<CountdownProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<CountdownEmits>();

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
  <div :class="[`yd-countdown`, { 'yd-countdown--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-countdown {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-countdown--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
