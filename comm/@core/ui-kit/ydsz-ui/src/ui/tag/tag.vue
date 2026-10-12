<script setup lang="ts" generic="T">
/**
* YdTag —— 标签组件。
* 
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\tag\tag.vue
 * @author ydsz-team
 * @since 26.10.11
 */
import { computed } from 'vue';

import type { TagEmits, TagProps, TagSize, TagVariant } from './tag-types';

defineOptions({ name: 'YdTag' });

const props = withDefaults(defineProps<TagProps>(), {
  bordered: true,
  closable: false,
  disabled: false,
  size: 'default',
  variant: 'default',
});

const emit = defineEmits<TagEmits>();

const variantClass = computed((): string => {
  const variantClasses: Record<TagVariant, string> = {
    default: 'yd-tag--default',
    outline: 'yd-tag--outline',
    primary: 'yd-tag--primary',
    success: 'yd-tag--success',
    warning: 'yd-tag--warning',
    danger: 'yd-tag--danger',
  };
  return variantClasses[props.variant ?? 'default'];
});

const sizeClass = computed((): string => {
  const sizeClasses: Record<TagSize, string> = {
    small: 'yd-tag--small',
    default: 'yd-tag--medium',
    large: 'yd-tag--large',
  };
  return sizeClasses[props.size ?? 'default'];
});

function handleClose(event: MouseEvent): void {
  event.stopPropagation();
  emit('close');
}
</script>

<template>
  <span
    :class="[
      'yd-tag',
      variantClass,
      sizeClass,
      { 'yd-tag--bordered': props.bordered, 'yd-tag--closable': props.closable, 'yd-tag--disabled': props.disabled },
      props.class,
    ]"
  >
    <span v-if="props.icon" class="yd-tag__icon" aria-hidden="true">
      <component :is="props.icon" v-if="typeof props.icon !== 'string'" />
      <span v-else>{{ props.icon }}</span>
    </span>
    <span class="yd-tag__text">
      <slot />
    </span>
    <button
      v-if="props.closable"
      type="button"
      class="yd-tag__close"
      :aria-label="'关闭标签'"
      @click="handleClose"
    >
      <svg viewBox="0 0 12 12" width="10" height="10" fill="currentColor" aria-hidden="true">
        <path d="M3.707 2.293a1 1 0 0 0-1.414 1.414L4.586 6l-2.293 2.293a1 1 0 1 0 1.414 1.414L6 7.414l2.293 2.293a1 1 0 0 0 1.414-1.414L7.414 6l2.293-2.293a1 1 0 0 0-1.414-1.414L6 4.586 3.707 2.293z" />
      </svg>
    </button>
  </span>
</template>

<style scoped>
.yd-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  font-size: 12px;
  line-height: 1.5;
  border-radius: 4px;
  transition: opacity 0.2s;
  white-space: nowrap;
}

.yd-tag--small {
  padding: 1px 6px;
  font-size: 11px;
}

.yd-tag--large {
  padding: 3px 10px;
  font-size: 13px;
}

.yd-tag--bordered {
  border: 1px solid transparent;
}

.yd-tag--default {
  background-color: var(--yd-color-bg-hover, #f5f7fa);
  color: var(--yd-color-text-primary, #303133);
  border-color: var(--yd-color-border, #e5e7eb);
}

.yd-tag--outline {
  background: transparent;
  color: var(--yd-color-text-secondary, #606266);
  border-color: var(--yd-color-border, #dcdfe6);
}

.yd-tag--primary {
  background-color: var(--yd-color-primary-bg-subtle, rgba(24, 144, 255, 0.12));
  color: var(--yd-color-primary, #1890ff);
  border-color: transparent;
}

.yd-tag--success {
  background-color: rgba(103, 194, 58, 0.12);
  color: #67c23a;
  border-color: transparent;
}

.yd-tag--warning {
  background-color: rgba(230, 162, 60, 0.12);
  color: #e6a23c;
  border-color: transparent;
}

.yd-tag--danger {
  background-color: rgba(245, 108, 108, 0.12);
  color: #f56c6c;
  border-color: transparent;
}

.yd-tag--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.yd-tag__icon {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

.yd-tag__text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.yd-tag__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  padding: 0;
  margin-left: 2px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: currentColor;
  border-radius: 50%;
  opacity: 0.7;
  transition: opacity 0.15s, background-color 0.15s;
}

.yd-tag__close:hover {
  opacity: 1;
  background-color: rgba(0, 0, 0, 0.08);
}
</style>
