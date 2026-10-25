<script setup lang="ts">
/**
 * YdDataTableCell —— 数据表格表体单元格。
 *
 * <p>承担三件事，使 YdDataTable 的左固定 / 中间 / 右固定三段不再重复编辑控件模板：
 * <ul>
 *   <li>编辑态：按 editType 渲染 input / textarea / select / date 控件；</li>
 *   <li>展示态：默认输出 value（空值兜底 '-'），可被插槽整体替换；</li>
 *   <li>交互：双击进入编辑、Enter 保存、Esc 取消、失焦保存。</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\data-table\YdDataTableCell.vue
 * @author ydsz-team
 * @since 5.7.0
 */
import { computed } from 'vue';

import { YdTableCell } from '../table';
import { useLocale } from '../../locale/useLocale';

import type { CSSProperties } from 'vue';
import type { CellEditOption, CellEditType } from './types';

defineOptions({ name: 'YdDataTableCell' });

interface Props {
  /** 行数据（树形模式下为扁平行的 row 对象） */
  row: Record<string, unknown>;
  /** 行唯一 key */
  rowKey: string;
  /** 列 key */
  columnKey: string;
  /** 单元格取值（draft 优先，由父级解析后传入） */
  value?: unknown;
  /** 行下标（插槽透出） */
  rowIndex?: number;
  /** 是否处于编辑态 */
  editing?: boolean;
  /** 该列是否允许编辑（决定 dblclick 与 cell 光标） */
  editable?: boolean;
  /** 编辑控件类型 */
  editType?: CellEditType;
  /** select 编辑候选项 */
  editOptions?: CellEditOption[];
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right';
  /** 附加类名（sticky / 可编辑提示） */
  cellClass?: string;
  /** 附加样式（列宽 / 固定偏移） */
  cellStyle?: CSSProperties;
}

const props = withDefaults(defineProps<Props>(), {
  align: 'left',
  editOptions: () => [],
  editType: 'input',
  editable: false,
  editing: false,
  rowIndex: 0,
  value: undefined,
});

const emit = defineEmits<{
  'edit-start': [rowKey: string, columnKey: string];
  'edit-draft': [rowKey: string, columnKey: string, value: string];
  'edit-save': [rowKey: string, columnKey: string, value: string, row: Record<string, unknown>];
  'edit-cancel': [rowKey: string, columnKey: string];
}>();

const { t } = useLocale();

/** 展示文本：value 为空值时兜底 '-' */
const displayText = computed<string | number>(() => {
  const raw = props.value;
  return raw === null || raw === undefined || raw === '' ? '-' : (raw as string | number);
});

/** 编辑控件绑定值（统一转字符串，number/date 原生控件要求 string value） */
const editValue = computed<string>(() => String(props.value ?? ''));

/** input[type] 取值：number / date 直透，其余按文本 */
const inputType = computed<string>(() =>
  props.editType === 'number' || props.editType === 'date' ? props.editType : 'text',
);

/** 双击进入编辑（仅可编辑列响应） */
function handleDblclick(): void {
  if (!props.editable) return;
  emit('edit-start', props.rowKey, props.columnKey);
}

/**
 * 键盘事件：Enter 提交、Esc 取消。
 *
 * @param event - 原生键盘事件
 * @param raw - 控件当前值
 * @returns 无
 */
function handleKeydown(event: KeyboardEvent, raw: string): void {
  if (event.key === 'Enter') {
    event.preventDefault();
    emit('edit-save', props.rowKey, props.columnKey, raw, props.row);
    return;
  }
  if (event.key === 'Escape') {
    event.preventDefault();
    emit('edit-cancel', props.rowKey, props.columnKey);
  }
}

/**
 * 从事件目标取出输入值并上报 draft。
 *
 * @param event - 原生 input 事件
 * @returns 无
 */
function handleDraft(event: Event): void {
  const raw = (event.target as HTMLInputElement).value;
  emit('edit-draft', props.rowKey, props.columnKey, raw);
}

/**
 * 失焦即保存。
 *
 * @param event - 原生 blur / focusout 事件
 * @returns 无
 */
function handleBlurSave(event: Event): void {
  const raw = (event.target as HTMLInputElement).value;
  emit('edit-save', props.rowKey, props.columnKey, raw, props.row);
}
</script>

<template>
  <YdTableCell
    :align="props.align"
    :class="cellClass"
    :style="cellStyle"
    @dblclick="handleDblclick"
  >
    <template v-if="props.editing">
      <textarea
        v-if="editType === 'textarea'"
        :value="editValue"
        :aria-label="t('table.editCell')"
        autofocus
        rows="2"
        class="yd-cell-input yd-cell-input--textarea"
        @input="handleDraft"
        @keydown="handleKeydown($event, ($event.target as HTMLTextAreaElement).value)"
        @blur="handleBlurSave"
      />
      <select
        v-else-if="editType === 'select'"
        :value="editValue"
        :aria-label="t('table.editCell')"
        autofocus
        class="yd-cell-input yd-cell-input--select"
        @change="handleDraft"
        @keydown="handleKeydown($event, ($event.target as HTMLSelectElement).value)"
        @blur="handleBlurSave"
      >
        <option
          v-for="opt in editOptions"
          :key="String(opt.value)"
          :value="opt.value"
        >
          {{ opt.label }}
        </option>
      </select>
      <input
        v-else
        :type="inputType"
        :value="editValue"
        :aria-label="t('table.editCell')"
        autofocus
        class="yd-cell-input"
        @input="handleDraft"
        @keydown="handleKeydown($event, ($event.target as HTMLInputElement).value)"
        @blur="handleBlurSave"
      />
    </template>
    <slot
      v-else
      :row="props.row"
      :row-index="props.rowIndex"
      :column-key="props.columnKey"
      :value="props.value"
      :text="displayText"
    >
      {{ displayText }}
    </slot>
  </YdTableCell>
</template>

<style scoped>
/* 编辑模式下输入框融入单元格，不破坏行高 */
.yd-cell-input {
  width: 100%;
  min-height: 28px;
  padding: 2px 6px;
  font-size: 0.875rem;
  line-height: 1.25rem;
  background: hsl(var(--background));
  border: 1px solid hsl(var(--primary));
  border-radius: 4px;
  outline: none;
  box-sizing: border-box;
  font-family: inherit;
  color: hsl(var(--foreground));
}

.yd-cell-input:focus {
  box-shadow: 0 0 0 2px hsl(var(--primary) / 25%);
}

.yd-cell-input--textarea {
  resize: vertical;
  min-height: 48px;
}

.yd-cell-input--select {
  appearance: auto;
}
</style>
