<!--
 * Mention（mention）组件：占位骨架，后续按需深化真实交互。
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { MentionEmits, MentionProps } from './mention-types';

defineOptions({ name: 'YdMention' });

const props = withDefaults(defineProps<MentionProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<MentionEmits>();

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
  <div :class="[`yd-mention`, { 'yd-mention--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
.yd-mention {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.yd-mention--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
