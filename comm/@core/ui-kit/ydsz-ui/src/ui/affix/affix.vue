<!--
 * Affix（affix）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { AffixEmits, AffixProps } from './affix-types';

defineOptions({ name: 'YdAffix' });

const props = withDefaults(defineProps<AffixProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<AffixEmits>();

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
  <div :class="[`yd-affix`, { 'yd-affix--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-affix {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-affix--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
