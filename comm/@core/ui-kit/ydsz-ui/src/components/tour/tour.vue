<script setup lang="ts">
/**
* Tour（tour）组件：占位骨架，后续按需深化真实交互。
* 
 * @author ydsz-ai
 * @since 1.0.0
 */
import type { YdTourEmits, YdTourProps } from './tour-types';

defineOptions({ name: 'YdTour' });

const props = withDefaults(defineProps<YdTourProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<YdTourEmits>();

</script>

<template>
  <div :class="[`yd-tour`, { 'yd-tour--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-tour {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-tour--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
