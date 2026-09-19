<!--
 * Statistic（statistic）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { StatisticEmits, StatisticProps } from './statistic-types';

defineOptions({ name: 'YdStatistic' });

const props = withDefaults(defineProps<StatisticProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<StatisticEmits>();

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
  <div :class="[`yd-statistic`, { 'yd-statistic--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-statistic {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-statistic--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
