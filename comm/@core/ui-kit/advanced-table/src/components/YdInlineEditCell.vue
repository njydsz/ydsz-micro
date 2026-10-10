<!--
 * YdInlineEditCell — 可编辑单元格组件。
 *
 * <p>点击后切换到编辑态（输入框），回车保存 / Esc 取消。
 * 通过 inject 获取父级 useCellEditor 提供的共享编辑状态。
 *
 * <p>使用方式：父级组件必须先调用 useCellEditor provide 状态，
 * 然后在本组件上绑定 rowKey / field / value 即可。
 *
 * @path comm\@core\ui-kit\advanced-table\src\components\YdInlineEditCell.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { computed } from 'vue';

import {
  injectCellEditor,
  type EditorType,
} from '../composables/use-cell-editor';

const props = defineProps<{
  /** 行唯一标识 */
  rowKey: string;
  /** 列字段名 */
  field: string;
  /** 显示值 */
  value: unknown;
  /** 编辑器类型，可选默认从列定义获取 */
  editorType?: EditorType;
  /** 选择器选项（当 editorType 为 'select' 时必传） */
  selectOptions?: ReadonlyArray<{ label: string; value: unknown }>;
}>();

const emit = defineEmits<{
  save: [rowKey: string, field: string, value: unknown];
  cancel: [];
}>();

/** 注入父级编辑状态 */
const editor = injectCellEditor();

/** 当前单元格是否正在编辑 */
const isEditing = computed<boolean>(() =>
  editor?.isCellEditing(props.rowKey, props.field) ?? false,
);

/** 当前编辑态的临时值 */
const draft = computed<unknown>(() =>
  isEditing.value ? editor?.currentEditor?.tempValue : props.value,
);

/** 当前编辑器类型 */
const activeEditorType = computed<EditorType>(
  () => props.editorType ?? editor?.currentEditor?.editorType ?? 'input',
);

/**
 * 进入编辑态。
 */
function handleStartEdit(): void {
  if (!editor) return;
  editor.startEdit(props.rowKey, props.field, props.value, activeEditorType.value);
}

/**
 * 确认保存。
 */
function handleSave(): void {
  if (!editor) return;
  const finalValue = editor.currentEditor?.tempValue ?? props.value;
  emit('save', props.rowKey, props.field, finalValue);
  editor.confirmEdit();
}

/**
 * 取消编辑（回滚）。
 */
function handleCancel(): void {
  editor?.cancelEdit();
  emit('cancel');
}

/**
 * 键盘事件：Enter 保存 / Esc 取消。
 */
function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter') {
    event.preventDefault();
    handleSave();
  } else if (event.key === 'Escape') {
    event.preventDefault();
    handleCancel();
  }
}

/**
 * 更新 draft。
 */
function handleInput(value: unknown): void {
  editor?.updateTempValue(value);
}
</script>

<template>
  <div class="adt-inline-cell h-full w-full">
    <!-- 数字编辑器 -->
    <input
      v-if="isEditing && activeEditorType === 'number'"
      :value="draft as number | string"
      type="number"
      autofocus
      class="h-full w-full rounded border border-primary bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
      @input="handleInput(($event.target as HTMLInputElement).value)"
      @keydown="handleKeydown"
      @blur="handleSave"
    />

    <!-- 下拉编辑器 -->
    <select
      v-else-if="isEditing && activeEditorType === 'select'"
      :value="draft as string | number"
      autofocus
      class="h-full w-full rounded border border-primary bg-background px-1 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
      @input="handleInput(($event.target as HTMLSelectElement).value)"
      @keydown="handleKeydown"
      @blur="handleSave"
    >
      <option
        v-for="opt in selectOptions"
        :key="String(opt.value)"
        :value="opt.value as string | number"
      >
        {{ opt.label }}
      </option>
    </select>

    <!-- 默认文本编辑器 -->
    <input
      v-else-if="isEditing"
      :value="draft as string"
      type="text"
      autofocus
      class="h-full w-full rounded border border-primary bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
      @input="handleInput(($event.target as HTMLInputElement).value)"
      @keydown="handleKeydown"
      @blur="handleSave"
    />

    <!-- 展示态 -->
    <div
      v-else
      class="flex h-full w-full cursor-pointer items-center px-2 py-1 text-sm hover:bg-muted/40"
      tabindex="0"
      role="button"
      :aria-label="`双击编辑: ${String(value)}`"
      @dblclick="handleStartEdit"
      @keydown.enter="handleStartEdit"
    >
      {{ value ?? '-' }}
    </div>
  </div>
</template>
