/**
 * useInlineEdit — 表格行内编辑组合式 API。
 *
 * <p>提供单元格级别的状态切换、值缓存和校验能力。
 * 典型场景：点击单元格进入编辑态 → 修改值 → 回车/失焦保存 → Esc 取消。
 *
 * @path comm\@core\ui-kit\advanced-table\src\composables\use-inline-edit.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { computed, ref } from 'vue';

/** 编辑中单元格状态 */
interface EditingCell<T> {
  /** 行唯一标识 */
  rowId: string;
  /** 列字段名 */
  field: keyof T;
  /** 编辑中的值 */
  draftValue: T[keyof T];
}

/**
 * 行内编辑 composable。
 *
 * @param options 配置项
 * @return 编辑状态和方法
 */
export function useInlineEdit<T extends Record<string, unknown>>(options: {
  /** 获取行唯一 ID 的函数 */
  getRowId: (row: T, index: number) => string;
  /** 保存回调 */
  onSave?: (row: T, field: keyof T, value: T[keyof T]) => void | Promise<void>;
} = {
  getRowId: (_row, idx) => String(idx),
}) {
  const { getRowId, onSave } = options;

  /** 当前正在编辑的单元格 */
  const editingCell = ref<EditingCell<T> | null>(null);

  /** 编辑过程中缓存的修改（rowId+field → draft value） */
  const draftChanges = ref<Map<string, unknown>>(new Map());

  /** 是否处于编辑态 */
  const isEditing = computed<boolean>(() => editingCell.value !== null);

  /**
   * 进入编辑态。
   *
   * @param row 行数据
   * @param rowIndex 行索引
   * @param field 列字段名
   * @param currentValue 当前单元格值
   */
  function startEditing(
    row: T,
    rowIndex: number,
    field: keyof T,
    currentValue: T[keyof T],
  ): void {
    editingCell.value = {
      rowId: getRowId(row, rowIndex),
      field,
      draftValue: currentValue,
    };
  }

  /**
   * 取消编辑（丢弃修改）。
   */
  function cancelEditing(): void {
    editingCell.value = null;
  }

  /**
   * 更新编辑中的值（仅缓存，不保存）。
   *
   * @param value 新值
   */
  function updateDraft<TField extends keyof T>(value: T[TField]): void {
    if (editingCell.value) {
      editingCell.value = { ...editingCell.value, draftValue: value as T[keyof T] };
    }
  }

  /**
   * 保存当前编辑（写入 draftChanges 并触发回调）。
   */
  async function saveEditing(): Promise<boolean> {
    if (!editingCell.value) {
      return false;
    }
    const { rowId, field, draftValue } = editingCell.value;
    const key = `${rowId}.${String(field)}`;
    draftChanges.value.set(key, draftValue);

    const result = onSave?.({} as T, field, draftValue);
    if (result instanceof Promise) {
      await result;
    }

    editingCell.value = null;
    return true;
  }

  /**
   * 判断指定单元格是否正在编辑。
   */
  function isCellEditing(rowId: string, field: keyof T): boolean {
    return editingCell.value?.rowId === rowId
      && editingCell.value?.field === field;
  }

  /**
   * 获取指定单元格的编辑态缓存值。
   */
  function getDraftValue<K extends keyof T>(
    rowId: string,
    field: K,
    fallback: T[K],
  ): T[K] {
    const key = `${rowId}.${String(field)}`;
    if (draftChanges.value.has(key)) {
      return draftChanges.value.get(key) as T[K];
    }
    return fallback;
  }

  /**
   * 清空所有未提交修改。
   */
  function clearDrafts(): void {
    draftChanges.value.clear();
    editingCell.value = null;
  }

  return {
    editingCell,
    draftChanges,
    isEditing,
    startEditing,
    cancelEditing,
    updateDraft,
    saveEditing,
    isCellEditing,
    getDraftValue,
    clearDrafts,
  };
}
