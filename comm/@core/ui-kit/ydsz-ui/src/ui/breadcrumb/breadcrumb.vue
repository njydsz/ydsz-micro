<script setup lang="ts">
/**
* Breadcrumb（breadcrumb）组件：占位骨架，后续按需深化真实交互。
* 
 * @author ydsz-ai
 * @since 1.0.0
 */
import type { BreadcrumbEmits, BreadcrumbProps } from './breadcrumb-types';

defineOptions({ name: 'YdBreadcrumb' });

const props = withDefaults(defineProps<BreadcrumbProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<BreadcrumbEmits>();

</script>

<template>
  <div :class="[`yd-breadcrumb`, { 'yd-breadcrumb--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-breadcrumb {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-breadcrumb--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
