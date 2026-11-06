/**
 * useDataTableSelection composable —— 表格行选择、汇总行与列选择器。
 *
 * <p>从 YdDataTable.vue 提取：封装行选中态、全选/半选判定、汇总行取值、
 * 列选择器状态与可见性同步，减少主组件体积。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\data-table\use-data-table-selection.ts
 * @author ydsz-team
 * @since 5.6.0
 */

import { computed, ref, type ComputedRef, type Ref } from 'vue';

import type { DataTableColumnDef } from './types';

/** useDataTableSelection 配置 */
export interface UseDataTableSelectionOptions<T extends Record<string, unknown>> {
  /** 行 key 提取器 */
  rowKey: (row: T, index: number) => string;
  /** 汇总行取值函数 */
  summary?: (rows: T[]) => Record<string, string | number>;
  /** 列定义 */
  columns: Ref<DataTableColumnDef<T>[]>;
  /** 选中集合（由 useTableData 提供） */
  selection: Ref<Set<string>>;
  /** 切换全选 */
  toggleSelectAll: () => void;
  /** 设置选中集合 */
  setSelected: (set: Set<string>) => void;
}

/** useDataTableSelection 返回结果 */
export interface UseDataTableSelectionReturn {
  /** 视图行 key 列表 */
  rowKeys: ComputedRef<string[]>;
  /** 是否全选 */
  isAllSelected: ComputedRef<boolean>;
  /** 是否部分选中 */
  someSelected: ComputedRef<boolean>;
  /** 汇总行取值 */
  summaryValues: ComputedRef<Record<string, string | number>>;
  /** 列选择器开关 */
  columnChooserOpen: Ref<boolean>;
  /** 列选择器列定义 */
  columnChooserColumns: ComputedRef<Array<{ hideable: boolean; key: string; label: string }>>;
  /** 全选/取消全选 */
  handleSelectAll: () => void;
  /** 切换单行 */
  handleSelect: (key: string) => void;
  /** 列可见性变更 */
  handleColumnVisibilityChange: (visibleKeys: string[]) => Record<string, boolean>;
  /** 列可见性重置 */
  handleColumnVisibilityReset: () => Record<string, boolean>;
}

/**
 * 表格行选择、汇总行与列选择器。
 *
 * @param dataRows - 当前渲染的数据行
 * @param options - 配置项
 * @returns 行选择与列选择器 API
 */
export function useDataTableSelection<T extends Record<string, unknown>>(
  dataRows: Ref<T[]>,
  options: UseDataTableSelectionOptions<T>,
): UseDataTableSelectionReturn {
  const { columns, rowKey, selection, setSelected, summary, toggleSelectAll } = options;

  /** 视图行 key 列表 */
  const rowKeys = computed<string[]>(() => dataRows.value.map((row, idx) => rowKey(row, idx)));

  /** 是否全选 */
  const isAllSelected = computed<boolean>(
    () => rowKeys.value.length > 0 && rowKeys.value.every((key) => selection.value.has(key)),
  );

  /** 是否部分选中 */
  const someSelected = computed<boolean>(
    () => rowKeys.value.some((key) => selection.value.has(key)) && !isAllSelected.value,
  );

  /** 汇总行取值（按列 key 索引） */
  const summaryValues = computed<Record<string, string | number>>(() =>
    summary && dataRows.value.length > 0 ? summary(dataRows.value) : {},
  );

  /** 列选择器 popover 开关 */
  const columnChooserOpen = ref(false);

  /** 列选择器所需的列定义 */
  const columnChooserColumns = computed(() =>
    columns.value.map((col) => ({
      hideable: col.fixed !== 'left' && col.fixed !== 'right',
      key: col.key,
      label: col.label ?? col.key,
    })),
  );

  /**
   * 全选 / 取消全选。
   *
   * @returns 无
   */
  function handleSelectAll(): void {
    toggleSelectAll();
  }

  /**
   * 切换单行选中态。
   *
   * @param key - 行 key
   * @returns 新的选中集合
   */
  function handleSelect(key: string): Set<string> {
    const next = new Set(selection.value);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelected(next);
    return next;
  }

  /**
   * 列可见性变更。
   *
   * @param visibleKeys - 可见列 key 列表
   * @returns 列 key → 可见性映射
   */
  function handleColumnVisibilityChange(visibleKeys: string[]): Record<string, boolean> {
    const vis: Record<string, boolean> = {};
    for (const col of columns.value) vis[col.key] = visibleKeys.includes(col.key);
    return vis;
  }

  /**
   * 列可见性重置。
   *
   * @returns 空映射（表示全部可见）
   */
  function handleColumnVisibilityReset(): Record<string, boolean> {
    return {};
  }

  return {
    columnChooserColumns,
    columnChooserOpen,
    handleColumnVisibilityChange,
    handleColumnVisibilityReset,
    handleSelect,
    handleSelectAll,
    isAllSelected,
    rowKeys,
    someSelected,
    summaryValues,
  };
}
