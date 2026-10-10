<!--
 * Input（input）组件：基于 design-tokens 语义化变量的文本输入基元。
 *
 * <p>通过 CSS 变量引用 `variables.css` 中定义的 token，
 * 支持 `data-theme="dark"` 自动切换。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\input\input.vue
 * @author ydsz-team
 * @since 26.09.24
 -->
<script setup lang="ts">
import { computed } from 'vue';

import type { InputEmits, InputProps } from './input-types';

defineOptions({ name: 'YdInput' });

const props = withDefaults(defineProps<InputProps>(), {
  disabled: false,
  open: false,
  modelValue: '',
  placeholder: '',
  type: 'text',
  variant: 'outline',
  size: 'md',
});

const emit = defineEmits<InputEmits>();

/** 派生 class：变体 + 尺寸 */
const inputClass = computed(() => [
  'yd-input',
  `yd-input--${props.variant}`,
  `yd-input--${props.size}`,
  { 'yd-input--disabled': props.disabled },
]);

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
}

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
  <div :class="inputClass">
    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      class="yd-input__field"
      @input="handleInput"
      @keyup.enter="handleConfirm"
    />
  </div>
</template>

<style scoped>
/* ==================== 容器 ==================== */
.yd-input {
  display: inline-flex;
  align-items: center;
  width: 100%;
}

/* ==================== 输入框本体 ==================== */
.yd-input__field {
  flex: 1;
  width: 100%;
  padding: var(--ydsz-spacing-xs) var(--ydsz-spacing-sm);

  background-color: hsl(var(--ydsz-surface-1));
  color: hsl(var(--ydsz-text-primary));

  border: 1px solid hsl(var(--ydsz-border-default));
  border-radius: var(--ydsz-radius-md);

  font-family: inherit;
  font-size: var(--ydsz-font-size-sm);
  line-height: var(--ydsz-line-height-normal);

  outline: none;
  transition:
    border-color var(--ydsz-motion-duration-fast) var(--ydsz-motion-easing-standard),
    background-color var(--ydsz-motion-duration-fast) var(--ydsz-motion-easing-standard),
    box-shadow var(--ydsz-motion-duration-fast) var(--ydsz-motion-easing-standard);
}

.yd-input__field::placeholder {
  color: hsl(var(--ydsz-text-tertiary));
}

.yd-input__field:hover:not(:disabled) {
  border-color: hsl(var(--ydsz-comp-border-hover));
}

.yd-input__field:focus {
  border-color: hsl(var(--ydsz-comp-border-focus));
  box-shadow: var(--ydsz-comp-focus-ring);
}

/* ==================== 变体：filled ==================== */
.yd-input--filled .yd-input__field {
  background-color: hsl(var(--ydsz-surface-2));
  border-color: transparent;
}

.yd-input--filled .yd-input__field:hover:not(:disabled) {
  background-color: var(--ydsz-comp-surface-hover);
}

.yd-input--filled .yd-input__field:focus {
  background-color: hsl(var(--ydsz-surface-1));
  border-color: hsl(var(--ydsz-comp-border-focus));
}

/* ==================== 变体：flushed ==================== */
.yd-input--flushed .yd-input__field {
  background-color: transparent;
  border-left: none;
  border-right: none;
  border-top: none;
  border-radius: 0;
  padding-left: 0;
  padding-right: 0;
}

.yd-input--flushed .yd-input__field:focus {
  border-color: hsl(var(--ydsz-comp-border-focus));
  box-shadow: none;
}

/* ==================== 尺寸 ==================== */
.yd-input--sm .yd-input__field {
  padding: var(--ydsz-spacing-xxs) var(--ydsz-spacing-xs);
  font-size: var(--ydsz-font-size-xs);
}

.yd-input--md .yd-input__field {
  padding: var(--ydsz-spacing-xs) var(--ydsz-spacing-sm);
  font-size: var(--ydsz-font-size-sm);
}

.yd-input--lg .yd-input__field {
  padding: var(--ydsz-spacing-sm) var(--ydsz-spacing-md);
  font-size: var(--ydsz-font-size-base);
}

/* ==================== 禁用态 ==================== */
.yd-input--disabled .yd-input__field,
.yd-input__field:disabled {
  background-color: var(--ydsz-comp-surface-disabled);
  color: hsl(var(--ydsz-text-disabled));
  cursor: not-allowed;
  opacity: 0.7;
}
</style>
