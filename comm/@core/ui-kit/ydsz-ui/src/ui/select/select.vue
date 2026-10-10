<!--
 * Select（select）组件：基于 design-tokens 语义化变量的选择器基元。
 *
 * <p>通过 CSS 变量引用 `variables.css` 中定义的 token，
 * 支持 `data-theme="dark"` 自动切换。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\select\select.vue
 * @author ydsz-team
 * @since 26.09.24
 -->
<script setup lang="ts">
import { computed } from 'vue';

import type { SelectEmits, SelectProps } from './select-types';

defineOptions({ name: 'YdSelect' });

const props = withDefaults(defineProps<SelectProps>(), {
  disabled: false,
  open: false,
  placeholder: '请选择',
  variant: 'outline',
  size: 'md',
});

const emit = defineEmits<SelectEmits>();

/** 派生 class：变体 + 尺寸 */
const selectClass = computed(() => [
  'yd-select',
  `yd-select--${props.variant}`,
  `yd-select--${props.size}`,
  { 'yd-select--disabled': props.disabled },
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
  <div :class="selectClass">
    <select
      :disabled="disabled"
      class="yd-select__field"
      @change="handleConfirm"
    >
      <option
        value=""
        disabled
      >
        {{ placeholder }}
      </option>
      <slot />
    </select>
  </div>
</template>

<style scoped>
/* ==================== 容器 ==================== */
.yd-select {
  display: inline-flex;
  align-items: center;
  width: 100%;
  position: relative;
}

/* ==================== 选择框本体 ==================== */
.yd-select__field {
  flex: 1;
  width: 100%;
  padding: var(--ydsz-spacing-xs) var(--ydsz-spacing-xl) var(--ydsz-spacing-xs) var(--ydsz-spacing-sm);

  appearance: none;
  -webkit-appearance: none;

  background-color: hsl(var(--ydsz-surface-1));
  color: hsl(var(--ydsz-text-primary));

  border: 1px solid hsl(var(--ydsz-border-default));
  border-radius: var(--ydsz-radius-md);

  font-family: inherit;
  font-size: var(--ydsz-font-size-sm);
  line-height: var(--ydsz-line-height-normal);

  /* SVG chevron via mask，颜色跟随 currentColor 即 --ydsz-text-tertiary，暗色自动适配 */
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E");
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E");
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: right var(--ydsz-spacing-xs) center;
  mask-position: right var(--ydsz-spacing-xs) center;
  -webkit-mask-size: 1.25em 1.25em;
  mask-size: 1.25em 1.25em;
  background-color: hsl(var(--ydsz-text-tertiary));

  outline: none;
  cursor: pointer;
  transition:
    border-color var(--ydsz-motion-duration-fast) var(--ydsz-motion-easing-standard),
    background-color var(--ydsz-motion-duration-normal) var(--ydsz-motion-easing-standard),
    box-shadow var(--ydsz-motion-duration-fast) var(--ydsz-motion-easing-standard);
}

.yd-select__field:hover:not(:disabled) {
  border-color: hsl(var(--ydsz-comp-border-hover));
}

.yd-select__field:focus {
  border-color: hsl(var(--ydsz-comp-border-focus));
  box-shadow: var(--ydsz-comp-focus-ring);
}

/* ==================== 变体：filled ==================== */
.yd-select--filled .yd-select__field {
  background-color: hsl(var(--ydsz-surface-2));
  border-color: transparent;
}

.yd-select--filled .yd-select__field:hover:not(:disabled) {
  background-color: var(--ydsz-comp-surface-hover);
}

.yd-select--filled .yd-select__field:focus {
  background-color: hsl(var(--ydsz-surface-1));
  border-color: hsl(var(--ydsz-comp-border-focus));
}

/* ==================== 尺寸 ==================== */
.yd-select--sm .yd-select__field {
  padding: var(--ydsz-spacing-xxs) var(--ydsz-spacing-lg) var(--ydsz-spacing-xxs) var(--ydsz-spacing-xs);
  padding-right: var(--ydsz-spacing-lg);
  font-size: var(--ydsz-font-size-xs);
}

.yd-select--md .yd-select__field {
  padding: var(--ydsz-spacing-xs) var(--ydsz-spacing-xl) var(--ydsz-spacing-xs) var(--ydsz-spacing-sm);
  font-size: var(--ydsz-font-size-sm);
}

.yd-select--lg .yd-select__field {
  padding: var(--ydsz-spacing-sm) var(--ydsz-spacing-xl) var(--ydsz-spacing-sm) var(--ydsz-spacing-md);
  font-size: var(--ydsz-font-size-base);
}

/* ==================== 禁用态 ==================== */
.yd-select--disabled .yd-select__field,
.yd-select__field:disabled {
  background-color: var(--ydsz-comp-surface-disabled);
  color: hsl(var(--ydsz-text-disabled));
  cursor: not-allowed;
  opacity: 0.7;
}
</style>
