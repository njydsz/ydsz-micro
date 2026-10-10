<!--
 * Table（table）组件：基于 design-tokens 语义化变量的数据表格基元。
 *
 * <p>通过 CSS 变量引用 `variables.css` 中定义的 token，
 * 支持 `data-theme="dark"` 自动切换。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\table\table.vue
 * @author ydsz-team
 * @since 26.09.24
 -->
<script setup lang="ts">
import { computed } from 'vue';

import type { TableEmits, TableProps } from './table-types';

defineOptions({ name: 'YdTable' });

const props = withDefaults(defineProps<TableProps>(), {
  disabled: false,
  open: false,
  striped: false,
  bordered: true,
  size: 'md',
});

const emit = defineEmits<TableEmits>();

/** 派生 class */
const tableClass = computed(() => [
  'yd-table',
  `yd-table--${props.size}`,
  {
    'yd-table--striped': props.striped,
    'yd-table--bordered': props.bordered,
    'yd-table--disabled': props.disabled,
  },
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
  <div :class="[tableClass, 'yd-table__wrapper']">
    <table class="yd-table__element">
      <thead
        v-if="$slots.header"
        class="yd-table__header"
      >
        <slot name="header" />
      </thead>
      <tbody class="yd-table__body">
        <slot />
      </tbody>
      <tfoot
        v-if="$slots.footer"
        class="yd-table__footer"
      >
        <slot name="footer" />
      </tfoot>
    </table>
  </div>
</template>

<style scoped>
/* ==================== 容器 ==================== */
.yd-table__wrapper {
  width: 100%;
  overflow-x: auto;
  border-radius: var(--ydsz-radius-lg);
  transition: opacity var(--ydsz-motion-duration-fast) var(--ydsz-motion-easing-standard);
}

/* ==================== 表格本体 ==================== */
.yd-table__element {
  width: 100%;
  border-collapse: collapse;
  background-color: hsl(var(--ydsz-surface-1));
  color: hsl(var(--ydsz-text-primary));
  font-size: var(--ydsz-font-size-sm);
}

/* ==================== 表头 ==================== */
.yd-table__header {
  background-color: hsl(var(--ydsz-surface-2));
}

.yd-table__header :deep(th) {
  padding: var(--ydsz-spacing-sm) var(--ydsz-spacing-md);
  text-align: left;
  font-weight: var(--ydsz-font-weight-semibold);
  font-size: var(--ydsz-font-size-xs);
  color: hsl(var(--ydsz-text-secondary));
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid hsl(var(--ydsz-border-default));
}

/* ==================== 表体 ==================== */
.yd-table__body :deep(tr) {
  border-bottom: 1px solid hsl(var(--ydsz-border-subtle));
  transition: background-color var(--ydsz-motion-duration-fast) var(--ydsz-motion-easing-standard);
}

.yd-table__body :deep(tr:last-child) {
  border-bottom: none;
}

.yd-table__body :deep(tr:hover) {
  background-color: var(--ydsz-comp-surface-hover);
}

.yd-table__body :deep(td) {
  padding: var(--ydsz-spacing-sm) var(--ydsz-spacing-md);
  color: hsl(var(--ydsz-text-primary));
  line-height: var(--ydsz-line-height-normal);
}

/* ==================== 斑马纹 ==================== */
.yd-table--striped .yd-table__body :deep(tr:nth-child(even)) {
  background-color: hsl(var(--ydsz-surface-2));
}

.yd-table--striped .yd-table__body :deep(tr:nth-child(even):hover) {
  background-color: var(--ydsz-comp-surface-hover);
}

/* ==================== 全边框 ==================== */
.yd-table--bordered .yd-table__wrapper {
  border: 1px solid hsl(var(--ydsz-border-default));
}

.yd-table--bordered .yd-table__element {
  border: 1px solid hsl(var(--ydsz-border-default));
}

.yd-table--bordered .yd-table__body :deep(td),
.yd-table--bordered .yd-table__header :deep(th) {
  border: 1px solid hsl(var(--ydsz-border-subtle));
}

/* ==================== 表脚 ==================== */
.yd-table__footer {
  background-color: hsl(var(--ydsz-surface-2));
}

.yd-table__footer :deep(td) {
  padding: var(--ydsz-spacing-sm) var(--ydsz-spacing-md);
  font-weight: var(--ydsz-font-weight-medium);
  color: hsl(var(--ydsz-text-primary));
  border-top: 1px solid hsl(var(--ydsz-border-default));
}

/* ==================== 尺寸 ==================== */
.yd-table--sm .yd-table__header :deep(th),
.yd-table--sm .yd-table__body :deep(td),
.yd-table--sm .yd-table__footer :deep(td) {
  padding: var(--ydsz-spacing-xs) var(--ydsz-spacing-sm);
  font-size: var(--ydsz-font-size-xs);
}

.yd-table--md .yd-table__header :deep(th),
.yd-table--md .yd-table__body :deep(td),
.yd-table--md .yd-table__footer :deep(td) {
  padding: var(--ydsz-spacing-sm) var(--ydsz-spacing-md);
  font-size: var(--ydsz-font-size-sm);
}

.yd-table--lg .yd-table__header :deep(th),
.yd-table--lg .yd-table__body :deep(td),
.yd-table--lg .yd-table__footer :deep(td) {
  padding: var(--ydsz-spacing-md) var(--ydsz-spacing-lg);
  font-size: var(--ydsz-font-size-base);
}

/* ==================== 禁用态 ==================== */
.yd-table--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
