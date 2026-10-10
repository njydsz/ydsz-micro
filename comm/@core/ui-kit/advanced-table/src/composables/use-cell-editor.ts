/**
 * useCellEditor —— 行内单元格编辑状态管理器。
 *
 * <p>提供细粒度的单元格编辑能力，通过 provide/inject 实现父子组件状态共享：
 * <ul>
 *   <li>调用方（表格）在 setup 中调用 useCellEditor，由它 provide 编辑状态；</li>
 *   <li>子组件（YdInlineEditCell）通过 inject 获取共享的 currentEditor 进行渲染。</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\advanced-table\src\composables\use-cell-editor.ts
 * @author ydsz-team
 * @since 26.09.24
 */

import { computed, provide, inject, ref } from 'vue';

import type { ComputedRef, InjectionKey, Ref } from 'vue';

/* ============================================================ */
/* 类型                                                          */
/* ============================================================ */

/** 编辑器类型 */
export type EditorType = 'input' | 'select' | 'number';

/** 编辑中的单元格状态 */
export interface CellEditorState {
  /** 行唯一标识 */
  rowKey: string;
  /** 列字段名 */
  field: string;
  /** 正在编辑的临时值 */
  tempValue: unknown;
  /** 进入编辑前原始值 */
  originalValue: unknown;
  /** 编辑器类型 */
  editorType: EditorType;
}

/** UseCellEditor 返回句柄 */
export interface UseCellEditorReturn {
  /** 当前编辑中的单元格（只读 computed） */
  currentEditor: ComputedRef<CellEditorState | null>;
  /** 是否处于编辑态（只读 computed） */
  isEditing: ComputedRef<boolean>;
  /** 判断指定单元格是否正在编辑 */
  isCellEditing: (rowKey: string, field: string) => boolean;
  /** 进入编辑态 */
  startEdit: (
    rowKey: string,
    field: string,
    currentValue: unknown,
    editorType?: EditorType,
  ) => void;
  /** 确认编辑（保留修改） */
  confirmEdit: () => void;
  /** 取消编辑（回滚到原始值） */
  cancelEdit: () => void;
  /** 更新临时值 */
  updateTempValue: (value: unknown) => void;
  /** 获取原始值 */
  getOriginalValue: () => unknown;
  /** 清空编辑态 */
  clearEdit: () => void;
}

/** UseCellEditor 配置 */
export interface UseCellEditorOptions {
  /**
   * 只读守卫回调，返回 true 表示该行该列不可编辑。
   *
   * @param rowKey - 行唯一标识
   * @param field - 列字段名
   * @returns 是否只读
   */
  isReadonly?: (rowKey: string, field: string) => boolean;
}

/** 依赖注入 key */
export const YDSZ_INLINE_EDIT_KEY: InjectionKey<UseCellEditorReturn> = Symbol('ydsz-inline-edit-state');

/* ============================================================ */
/* useCellEditor                                                 */
/* ============================================================ */

/**
 * useCellEditor —— 单元格级别编辑状态管理器。
 *
 * <p>通常只在父级组件（如表格）中调用一次，状态会自动向下注入给
 * 所有通过 inject(YDSZ_INLINE_EDIT_KEY) 的子组件。
 *
 * @param options - 配置项
 * @returns 编辑状态句柄
 *
 * @example
 * ```ts
 * // 父组件
 * const editor = useCellEditor({
 *   isReadonly: (rowKey, field) => field === 'id',
 * });
 *
 * // 子组件
 * const editor = inject(YDSZ_INLINE_EDIT_KEY)!;
 * editor.startEdit('row1', 'name', '当前值', 'input');
 * ```
 */
export function useCellEditor(
  options: UseCellEditorOptions = {},
): UseCellEditorReturn {
  const { isReadonly } = options;

  /** 当前编辑中的单元格（null 表示无编辑态） */
  const currentEditorState = ref<CellEditorState | null>(null);

  /** 是否处于编辑态（只读 computed） */
  const isEditing = computed<boolean>(() => currentEditorState.value !== null);

  /** 当前编辑单元格（只读计算属性） */
  const currentEditor = computed<CellEditorState | null>(
    () => currentEditorState.value,
  );

  /**
   * 判断指定单元格是否正在编辑。
   */
  function isCellEditing(rowKey: string, field: string): boolean {
    const state = currentEditorState.value;
    return state?.rowKey === rowKey && state?.field === field;
  }

  /**
   * 进入编辑态。
   *
   * <p>如果 isReadonly 回调返回 true，则拒绝进入编辑态。
   *
   * @param rowKey - 行唯一标识
   * @param field - 列字段名
   * @param currentValue - 当前值
   * @param editorType - 编辑器类型，默认 'input'
   */
  function startEdit(
    rowKey: string,
    field: string,
    currentValue: unknown,
    editorType: EditorType = 'input',
  ): void {
    if (isReadonly?.(rowKey, field)) {
      return;
    }
    currentEditorState.value = {
      rowKey,
      field,
      tempValue: currentValue,
      originalValue: currentValue,
      editorType,
    };
  }

  /**
   * 确认编辑（保留 tempValue 作为最终值）。
   */
  function confirmEdit(): void {
    currentEditorState.value = null;
  }

  /**
   * 取消编辑（回滚到 originalValue）。
   */
  function cancelEdit(): void {
    currentEditorState.value = null;
  }

  /**
   * 更新编辑中的临时值。
   *
   * @param value - 新值
   */
  function updateTempValue(value: unknown): void {
    const state = currentEditorState.value;
    if (state) {
      currentEditorState.value = { ...state, tempValue: value };
    }
  }

  /**
   * 获取当前编辑单元格的原始值。
   */
  function getOriginalValue(): unknown {
    return currentEditorState.value?.originalValue ?? null;
  }

  /**
   * 清空当前编辑态。
   */
  function clearEdit(): void {
    currentEditorState.value = null;
  }

  const api: UseCellEditorReturn = {
    currentEditor,
    isEditing,
    isCellEditing,
    startEdit,
    confirmEdit,
    cancelEdit,
    updateTempValue,
    getOriginalValue,
    clearEdit,
  };

  // 向子组件提供编辑状态
  provide(YDSZ_INLINE_EDIT_KEY, api);

  return api;
}

/* ============================================================ */
/* injectCellEditor                                              */
/* ============================================================ */

/**
 * 在子组件中注入由父级 useCellEditor 提供的编辑状态。
 *
 * <p>如果父级未调用 useCellEditor，将返回 null，调用方需做兜底处理。
 *
 * @returns 编辑状态句柄，或 null（未提供时）
 */
export function injectCellEditor(): UseCellEditorReturn | null {
  return inject<UseCellEditorReturn | null>(YDSZ_INLINE_EDIT_KEY, null);
}
