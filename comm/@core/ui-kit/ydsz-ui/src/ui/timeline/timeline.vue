<!--
 * Timeline（timeline）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { TimelineEmits, TimelineProps } from './timeline-types';

defineOptions({ name: 'YdTimeline' });

const props = withDefaults(defineProps<TimelineProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<TimelineEmits>();

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
  <div :class="[`yd-timeline`, { 'yd-timeline--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-timeline {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-timeline--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
