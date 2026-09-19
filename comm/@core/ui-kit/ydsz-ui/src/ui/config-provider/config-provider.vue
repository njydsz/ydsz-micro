<!--
 * ConfigProvider（config-provider）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { ConfigProviderEmits, ConfigProviderProps } from './config-provider-types';

defineOptions({ name: 'YdConfigProvider' });

const props = withDefaults(defineProps<ConfigProviderProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<ConfigProviderEmits>();

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
  <div :class="[`yd-config-provider`, { 'yd-config-provider--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-config-provider {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-config-provider--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
