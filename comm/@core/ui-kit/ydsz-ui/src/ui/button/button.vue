<!--
 * Button（button）组件：基于 design-tokens 语义化变量的按钮基元。
 *
 * <p>通过 CSS 变量引用 `variables.css` 中定义的 token，
 * 支持 `data-theme="dark"` 自动切换。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\button\button.vue
 * @author ydsz-team
 * @since 26.09.24
 -->
<script setup lang="ts">
import { computed } from 'vue';

import type { ButtonEmits, ButtonProps } from './button-types';

defineOptions({ name: 'YdButton' });

const props = withDefaults(defineProps<ButtonProps>(), {
  disabled: false,
  open: false,
  variant: 'primary',
  size: 'md',
});

const emit = defineEmits<ButtonEmits>();

/** 派生 class：变体 + 尺寸 */
const buttonClass = computed(() => [
  'yd-button',
  `yd-button--${props.variant}`,
  `yd-button--${props.size}`,
  { 'yd-button--disabled': props.disabled },
]);

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
  <button
    :class="buttonClass"
    :disabled="disabled"
    type="button"
    @click="handleConfirm"
  >
    <slot />
  </button>
</template>

<style scoped>
/* ==================== 基础布局 ==================== */
.yd-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--ydsz-spacing-xs);

  border: 1px solid transparent;
  border-radius: var(--ydsz-radius-md);

  font-family: inherit;
  font-weight: var(--ydsz-font-weight-medium);
  line-height: var(--ydsz-line-height-tight);
  white-space: nowrap;
  text-decoration: none;

  cursor: pointer;
  user-select: none;
  transition:
    background-color var(--ydsz-motion-duration-fast) var(--ydsz-motion-easing-standard),
    border-color var(--ydsz-motion-duration-fast) var(--ydsz-motion-easing-standard),
    color var(--ydsz-motion-duration-fast) var(--ydsz-motion-easing-standard),
    box-shadow var(--ydsz-motion-duration-fast) var(--ydsz-motion-easing-standard);
}

.yd-button:focus-visible {
  outline: none;
  box-shadow: var(--ydsz-comp-focus-ring);
}

/* ==================== 尺寸 ==================== */
.yd-button--sm {
  padding: var(--ydsz-spacing-xxs) var(--ydsz-spacing-xs);
  font-size: var(--ydsz-font-size-xs);
}

.yd-button--md {
  padding: var(--ydsz-spacing-xs) var(--ydsz-spacing-md);
  font-size: var(--ydsz-font-size-sm);
}

.yd-button--lg {
  padding: var(--ydsz-spacing-sm) var(--ydsz-spacing-lg);
  font-size: var(--ydsz-font-size-base);
}

/* ==================== 变体：primary ==================== */
.yd-button--primary {
  background-color: hsl(var(--ydsz-color-brand-500));
  color: hsl(var(--ydsz-text-inverse));
  border-color: hsl(var(--ydsz-color-brand-500));
}

.yd-button--primary:hover:not(:disabled) {
  background-color: hsl(var(--ydsz-color-brand-600));
  border-color: hsl(var(--ydsz-color-brand-600));
}

.yd-button--primary:active:not(:disabled) {
  background-color: hsl(var(--ydsz-color-brand-700));
  border-color: hsl(var(--ydsz-color-brand-700));
}

/* ==================== 变体：secondary ==================== */
.yd-button--secondary {
  background-color: hsl(var(--ydsz-surface-1));
  color: hsl(var(--ydsz-text-primary));
  border-color: hsl(var(--ydsz-border-default));
}

.yd-button--secondary:hover:not(:disabled) {
  background-color: var(--ydsz-comp-surface-hover);
  border-color: hsl(var(--ydsz-comp-border-hover));
}

.yd-button--secondary:active:not(:disabled) {
  background-color: var(--ydsz-comp-surface-active);
}

/* ==================== 变体：ghost ==================== */
.yd-button--ghost {
  background-color: transparent;
  color: hsl(var(--ydsz-text-secondary));
  border-color: transparent;
}

.yd-button--ghost:hover:not(:disabled) {
  background-color: var(--ydsz-comp-surface-hover);
  color: hsl(var(--ydsz-text-primary));
}

.yd-button--ghost:active:not(:disabled) {
  background-color: var(--ydsz-comp-surface-active);
}

/* ==================== 变体：destructive ==================== */
.yd-button--destructive {
  background-color: var(--ydsz-comp-danger-bg);
  color: hsl(var(--ydsz-comp-danger-text));
  border-color: var(--ydsz-comp-danger-border);
}

.yd-button--destructive:hover:not(:disabled) {
  background-color: var(--ydsz-comp-danger-bg-hover);
  border-color: var(--ydsz-comp-danger-bg-hover);
}

.yd-button--destructive:active:not(:disabled) {
  background-color: var(--ydsz-comp-danger-bg-active);
  border-color: var(--ydsz-comp-danger-bg-active);
}

/* ==================== 禁用态 ==================== */
.yd-button--disabled,
.yd-button:disabled {
  opacity: 0.5;
  pointer-events: none;
  cursor: not-allowed;
}
</style>
