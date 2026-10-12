/**
 * useTableEditing Composable —— 表格行内编辑状态机（编辑中单元格集合 / 启停 / 校验）。
 *
 * <p>与 {@link useTableData}（排序/筛选/选择）互补分区：本 composable 仅负责
 * "哪个单元格正在编辑" 的状态管理，不介入数据变换。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-table-editing.ts
 * @author ydsz-team
 * @since 5.6.0
 */

import { ref } from 'vue';

import type { Ref } from 'vue';

/* ============================================================ */
/* 类型                                                          */
/* ============================================================ */

/** 单元格编辑类型 */
export type CellEditType = 'input' | 'number' | 'select' | 'date' | 'textarea';

/** 校验结果：null 表示通过，否则为错误文案 */
export type EditValidationResult = string | null;

/** 行内编辑回调上下文 */
export interface TableEditingCallbacks<T> {
  /**
   * 列级校验函数。
   *
   * @param value - 当前输入值
   * @param row   - 所属行数据
   * @returns 校验结果（null/undefined 表示通过）
   */
  validator?: (value: string, row: T) => EditValidationResult;
}

/* ============================================================ */
/* 选项 / 返回值                                                  */
/* ============================================================ */

/** useTableEditing 选项 */
export interface UseTableEditingOptions<T> {
  /** 外部受控编辑行 key 集合（可选；不传则使用内部状态） */
  editingKeys?: Ref<Set<string>>;
  /** 列编辑类型映射 */
  editConfig?: Ref<Map<string, CellEditType>>;
  /** 编辑回调（校验等） */
  callbacks?: TableEditingCallbacks<T>;
}

/** useTableEditing 返回句柄 */
export interface UseTableEditingReturn<T> {
  /** 当前正在编辑的单元格 key 集合（内部 ref，受控模式下为同一引用） */
  editingCellKeys: Ref<Set<string>>;
  /** 判断指定单元格是否正在编辑 */
  isEditing: (rowKey: string, columnKey: string) => boolean;
  /** 进入编辑模式（行维粗粒度：启用该行所有可编辑列） */
  startEdit: (rowKey: string, columnKey: string) => void;
  /** 取消当前所有编辑 */
  cancelEdit: () => void;
  /** 保存并退出编辑（含校验） */
  saveEdit: (rowKey: string, columnKey: string, value: unknown, row: T) => EditValidationResult;
  /** 编辑态临时值映射 */
  draftValues: Ref<Map<string, string>>;
  /** 更新临时值 */
  setDraftValue: (rowKey: string, columnKey: string, value: string) => void;
  /** 清空临时值 */
  clearDraft: (rowKey: string, columnKey: string) => void;
}

/** 单元格 key 分隔符（避免 rowKey / columnKey 单独包含 ':' 时冲突） */
const CELL_KEY_SEPARATOR = '\u0000';

/** 组合单元格 key */
function composeCellKey(rowKey: string, columnKey: string): string {
  return `${rowKey}${CELL_KEY_SEPARATOR}${columnKey}`;
}

/** 拆分单元格 key */
function parseCellKey(cellKey: string): { rowKey: string; columnKey: string } {
  const idx = cellKey.indexOf(CELL_KEY_SEPARATOR);
  if (idx === -1) {
    return { columnKey: '', rowKey: cellKey };
  }
  return {
    columnKey: cellKey.slice(idx + 1),
    rowKey: cellKey.slice(0, idx),
  };
}

/* ============================================================ */
/* useTableEditing                                                */
/* ============================================================ */

/**
 * useTableEditing —— 行内单元格编辑状态机。
 *
 * @typeParam T - 行数据类型
 * @param options - 配置项
 * @returns 编辑句柄
 */
export function useTableEditing<T extends Record<string, unknown>>(
  options: UseTableEditingOptions<T> = {},
): UseTableEditingReturn<T> {
  const { editingKeys, callbacks } = options;

  /** 内部编辑 cell key 集合（受控模式下直接使用外部 ref） */
  const internalEditingCellKeys = ref<Set<string>>(new Set());
  const editingCellKeys = editingKeys ?? internalEditingCellKeys;

  /** 编辑态临时值：cellKey -> 字符串值 */
  const draftValues = ref<Map<string, string>>(new Map());

  /**
   * 判断指定单元格是否正在编辑。
   */
  function isEditing(rowKey: string, columnKey: string): boolean {
    if (!rowKey && !columnKey) return false;
    return editingCellKeys.value.has(composeCellKey(rowKey, columnKey));
  }

  /**
   * 进入编辑模式。
   *
   * <p>若列 editConfig 存在但对应列未配置，仍允许进入（作为默认 input）。
   * 校验仅发生在保存阶段，不在进入阶段阻塞。
   */
  function startEdit(rowKey: string, columnKey: string): void {
    const next = new Set(editingCellKeys.value);
    next.add(composeCellKey(rowKey, columnKey));
    editingCellKeys.value = next;
  }

  /**
   * 取消当前所有编辑并清空临时值。
   */
  function cancelEdit(): void {
    editingCellKeys.value = new Set();
    draftValues.value = new Map();
  }

  /**
   * 保存并退出编辑。
   *
   * <p>先执行可选的列校验；校验失败时返回错误文案并**保持编辑态**。
   * 校验通过后清空该单元格编辑态与 draft。
   *
   * @returns 校验结果：null 表示通过并退出编辑态，否则为错误文案
   */
  function saveEdit(
    rowKey: string,
    columnKey: string,
    value: unknown,
    row: T,
  ): EditValidationResult {
    const strValue = String(value ?? '');
    const error = callbacks?.validator?.(strValue, row) ?? null;
    if (error) {
      return error;
    }

    const cellKey = composeCellKey(rowKey, columnKey);
    const nextKeys = new Set(editingCellKeys.value);
    nextKeys.delete(cellKey);
    editingCellKeys.value = nextKeys;

    const nextDrafts = new Map(draftValues.value);
    nextDrafts.delete(cellKey);
    draftValues.value = nextDrafts;

    return null;
  }

  /**
   * 更新单元格临时值（不退出编辑态）。
   */
  function setDraftValue(rowKey: string, columnKey: string, value: string): void {
    const cellKey = composeCellKey(rowKey, columnKey);
    const next = new Map(draftValues.value);
    next.set(cellKey, value);
    draftValues.value = next;
  }

  /**
   * 清空指定单元格临时值（保留编辑态）。
   */
  function clearDraft(rowKey: string, columnKey: string): void {
    const cellKey = composeCellKey(rowKey, columnKey);
    const next = new Map(draftValues.value);
    next.delete(cellKey);
    draftValues.value = next;
  }

  return {
    editingCellKeys,
    isEditing,
    startEdit,
    cancelEdit,
    saveEdit,
    draftValues,
    setDraftValue,
    clearDraft,
  };
}

/* 重新导出辅助函数与常量 */
export { composeCellKey, parseCellKey, CELL_KEY_SEPARATOR };

/** 便捷 hook：从行 key 获取当前行所有正在编辑的列 key */
export function getEditingColumns(
  editingKeys: Set<string>,
  rowKey: string,
): string[] {
  const prefix = `${rowKey}${CELL_KEY_SEPARATOR}`;
  const result: string[] = [];
  for (const key of editingKeys) {
    if (key.startsWith(prefix)) {
      result.push(key.slice(prefix.length));
    }
  }
  return result;
}
