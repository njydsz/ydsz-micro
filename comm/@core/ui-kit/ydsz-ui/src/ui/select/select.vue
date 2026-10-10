<!--
 * Select（select）组件：基于 design-tokens 语义化变量的选择器基元。
 *
 * <p>通过 CSS 变量引用 `variables.css` 中定义的 token，
 * 支持 `data-theme="dark"` 自动切换。
 *
 * WAI-ARIA 无障碍改进（云顶 §11 可访问性）:
 * - role="combobox" + aria-expanded + aria-haspopup="listbox" + aria-controls
 * - aria-activedescendant 指向当前高亮选项
 * - aria-multiselectable 支持多选模式
 * - 选项列表 role="listbox" + role="option" + aria-selected（通过 slot 注入）
 * - 键盘支持：↑↓选择 / Esc关闭 / Home-End跳转 / Typeahead（由原生 select 提供）
 * - aria-label / aria-labelledby 关联标签
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
  multiple: false,
});

const emit = defineEmits<SelectEmits>();

/** 派生 class：变体 + 尺寸 */
const selectClass = computed(() => [
  'yd-select',
  `yd-select--${props.variant}`,
  `yd-select--${props.size}`,
  { 'yd-select--disabled': props.disabled },
]);

/** 选项列表的稳定 id（用于 aria-controls） */
const optionsId = computed(() => props.ariaControls ?? `__yd-select-options-${Math.random().toString(36).slice(2, 10)}`);

/** combobox 包装器的 ARIA 绑定（不含 class，由 :class 单独绑定避免冲突） */
const comboboxAttrs = computed(() => ({
  role: 'combobox' as const,
  'aria-expanded': props.open ? ('true' as const) : ('false' as const),
  'aria-haspopup': 'listbox' as const,
  'aria-controls': props.open ? optionsId.value : undefined,
  'aria-activedescendant': props.open ? (props.ariaActivedescendant ?? undefined) : undefined,
  'aria-multiselectable': props.multiple ? ('true' as const) : undefined,
}));

/** 原生 select 元素的 ARIA 绑定 */
const selectAttrs = computed(() => ({
  'aria-label': props.ariaLabel ?? undefined,
  'aria-labelledby': props.ariaLabelledby ?? undefined,
}));

function handleChange(event: Event) {
  if (props.disabled) return;
  const target = event.target as HTMLSelectElement;
  const selectedOption = target.options[target.selectedIndex];
  // 关闭下拉并向上同步 activedescendant 信息
  if (selectedOption && selectedOption.id) {
    emit('update:open', false);
  }
  emit('confirm');
}
</script>

<template>
  <div
    :class="selectClass"
    v-bind="comboboxAttrs"
  >
    <select
      :id="optionsId"
      :disabled="disabled"
      :multiple="multiple"
      class="yd-select__field"
      v-bind="selectAttrs"
      @change="handleChange"
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
