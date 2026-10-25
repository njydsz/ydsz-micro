/**
 * useTableCellEdit —— 单元格行内编辑装配（受控桥接 / 编辑类型解析 / 校验落库）。
 *
 * <p>在 {@link useTableEditing} 状态机之上补齐三件事：
 * <ul>
 *   <li>把 props 上的普通 Set / Map 桥接成 composable 需要的 Ref（受控同步）</li>
 *   <li>按 `editConfig > 列定义 > 默认 input` 的优先级解析编辑类型与选项</li>
 *   <li>保存时执行列级 `editValidator`，失败则保持编辑态交由上层处理</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\data-table\use-table-cell-edit.ts
 * @author ydsz-team
 * @since 5.7.0
 */

import { computed, ref, toValue, watch } from 'vue';

import { composeCellKey, useTableEditing } from '../../composables/use-table-editing';

import type { MaybeRefOrGetter, Ref } from 'vue';
import type { CellEditOption, CellEditType, DataTableColumnDef } from './types';

/** useTableCellEdit 配置 */
export interface UseTableCellEditOptions<T extends Record<string, unknown>> {
  /** 行内编辑总开关 */
  editable: MaybeRefOrGetter<boolean>;
  /** 受控编辑单元格 key 集合 */
  editingKeys?: MaybeRefOrGetter<Set<string> | undefined>;
  /** 受控列编辑类型映射（优先级高于列定义） */
  editConfig?: MaybeRefOrGetter<Map<string, CellEditType> | undefined>;
  /** 列 key → 列定义 */
  findColumn: (columnKey: string) => DataTableColumnDef<T> | undefined;
  /** 按 rowKey 反查行数据（取消编辑等兜底场景） */
  resolveRow: (rowKey: string) => T;
  /** 进入编辑态 */
  onEditStart?: (rowKey: string, columnKey: string) => void;
  /** 值变更（校验失败时同样触发，便于上层展示错误） */
  onEdit?: (rowKey: string, columnKey: string, value: string, row: T) => void;
  /** 退出编辑态 */
  onEditEnd?: (rowKey: string, columnKey: string, value: string) => void;
}

/** useTableCellEdit 返回句柄 */
export interface UseTableCellEditReturn<T> {
  /** 当前编辑中的单元格 key 集合 */
  editingCellKeys: Ref<Set<string>>;
  /** 单元格编辑态临时值 */
  draftValues: Ref<Map<string, string>>;
  /** 单元格是否正在编辑 */
  isCellEditing: (rowKey: string, columnKey: string) => boolean;
  /** 解析列编辑类型 */
  resolveEditType: (columnKey: string) => CellEditType;
  /** 解析列编辑选项（select 类型） */
  resolveEditOptions: (columnKey: string) => CellEditOption[];
  /** 解析单元格展示值（draft 优先） */
  resolveCellValue: (
    row: T,
    columnKey: string,
    rowKey: string,
    rowIndex: number,
  ) => unknown;
  /** 进入编辑态（列需声明 editable） */
  startEdit: (rowKey: string, columnKey: string) => void;
  /** 更新临时值 */
  setDraft: (rowKey: string, columnKey: string, value: string) => void;
  /** 校验并保存 */
  save: (rowKey: string, columnKey: string, value: string, row: T) => void;
  /** 放弃编辑 */
  cancel: (rowKey: string, columnKey: string) => void;
}

/**
 * 装配单元格行内编辑能力。
 *
 * @param options - 编辑配置与回调
 * @returns 编辑句柄
 */
export function useTableCellEdit<T extends Record<string, unknown>>(
  options: UseTableCellEditOptions<T>,
): UseTableCellEditReturn<T> {
  /**
   * props 上的 Set / Map 是普通值，而 useTableEditing 需要 Ref 才能用替换模式触发更新，
   * 因此本地各持一份 ref 并与 prop 单向同步。
   */
  const internalEditingKeys: Ref<Set<string>> = ref(
    new Set(toValue(options.editingKeys) ?? []),
  );
  const internalEditConfig: Ref<Map<string, CellEditType>> = ref(
    new Map(toValue(options.editConfig) ?? []),
  );

  watch(
    () => toValue(options.editingKeys),
    (next) => {
      if (next) internalEditingKeys.value = new Set(next);
    },
  );
  watch(
    () => toValue(options.editConfig),
    (next) => {
      if (next) internalEditConfig.value = new Map(next);
    },
  );

  const editing = useTableEditing<T>({
    editConfig: internalEditConfig,
    editingKeys: internalEditingKeys,
  });

  const editableMode = computed<boolean>(() => toValue(options.editable));

  const cellKey = (rowKey: string, columnKey: string): string =>
    composeCellKey(rowKey, columnKey);

  /**
   * 单元格是否处于编辑态。
   *
   * @param rowKey - 行 key
   * @param columnKey - 列 key
   * @returns 是否正在编辑
   */
  function isCellEditing(rowKey: string, columnKey: string): boolean {
    return editableMode.value
      && editing.editingCellKeys.value.has(cellKey(rowKey, columnKey));
  }

  /**
   * 解析列编辑类型（editConfig 优先于列定义，兜底 input）。
   *
   * @param columnKey - 列 key
   * @returns 编辑类型
   */
  function resolveEditType(columnKey: string): CellEditType {
    return internalEditConfig.value.get(columnKey)
      ?? options.findColumn(columnKey)?.editType
      ?? 'input';
  }

  /**
   * 解析列编辑选项。
   *
   * @param columnKey - 列 key
   * @returns select 类型的候选项
   */
  function resolveEditOptions(columnKey: string): CellEditOption[] {
    return options.findColumn(columnKey)?.editOptions ?? [];
  }

  /**
   * 解析单元格展示值：编辑中的 draft 优先，其次列 formatter，最后原始字段。
   *
   * @param row - 行数据
   * @param columnKey - 列 key
   * @param rowKey - 行 key
   * @param rowIndex - 行下标
   * @returns 单元格值
   */
  function resolveCellValue(
    row: T,
    columnKey: string,
    rowKey: string,
    rowIndex: number,
  ): unknown {
    const draft = editing.draftValues.value.get(cellKey(rowKey, columnKey));
    if (draft !== undefined) return draft;
    const raw = (row as Record<string, unknown>)[columnKey];
    const formatter = options.findColumn(columnKey)?.formatter;
    return formatter ? formatter(row, raw, rowIndex) : raw;
  }

  /**
   * 进入编辑态，未声明 editable 的列直接忽略。
   *
   * @param rowKey - 行 key
   * @param columnKey - 列 key
   * @returns 无
   */
  function startEdit(rowKey: string, columnKey: string): void {
    if (!editableMode.value || !options.findColumn(columnKey)?.editable) return;
    editing.startEdit(rowKey, columnKey);
    options.onEditStart?.(rowKey, columnKey);
  }

  /**
   * 保存单元格：列校验失败时保持编辑态，仅回传值。
   *
   * @param rowKey - 行 key
   * @param columnKey - 列 key
   * @param value - 输入值
   * @param row - 行数据
   * @returns 无
   */
  function save(rowKey: string, columnKey: string, value: string, row: T): void {
    const error = options.findColumn(columnKey)?.editValidator?.(value, row) ?? null;
    if (error) {
      options.onEdit?.(rowKey, columnKey, value, row);
      return;
    }
    editing.saveEdit(rowKey, columnKey, value, row);
    options.onEdit?.(rowKey, columnKey, value, row);
    options.onEditEnd?.(rowKey, columnKey, value);
  }

  /**
   * 取消编辑：丢弃 draft 并退出编辑态。
   *
   * @param rowKey - 行 key
   * @param columnKey - 列 key
   * @returns 无
   */
  function cancel(rowKey: string, columnKey: string): void {
    editing.clearDraft(rowKey, columnKey);
    editing.saveEdit(rowKey, columnKey, '', options.resolveRow(rowKey));
    options.onEditEnd?.(rowKey, columnKey, '');
  }

  return {
    cancel,
    draftValues: editing.draftValues,
    editingCellKeys: editing.editingCellKeys,
    isCellEditing,
    resolveCellValue,
    resolveEditOptions,
    resolveEditType,
    save,
    setDraft: (rowKey, columnKey, value) => editing.setDraftValue(rowKey, columnKey, value),
    startEdit,
  };
}
