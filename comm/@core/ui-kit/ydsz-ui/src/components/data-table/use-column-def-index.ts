/**
 * 列定义索引（columnKey → 定义）。
 *
 * <p>从 YdDataTable.vue 抽离，控制单文件脚本行数（SFC-006）。
 * 覆盖多级表头的分组子列，供列布局与单元格渲染按 key 快速定位。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\data-table\use-column-def-index.ts
 * @author ydsz-team
 * @since 26.11.06
 */
import type { DataTableColumnDef } from './types';

import { computed, type ComputedRef } from 'vue';

/**
 * 列定义索引组合式函数。
 *
 * @param columns - 列定义（响应式）
 * @returns 索引 Map 与按 key 查找函数
 */
export function useColumnDefIndex<T extends Record<string, unknown>>(
  columns: () => DataTableColumnDef<T>[],
): {
  /** 列定义查找表（含多级表头子列） */
  columnDefByKey: ComputedRef<Map<string, DataTableColumnDef<T>>>;
  /** 按 key 取列定义 */
  findColumn: (columnKey: string) => DataTableColumnDef<T> | undefined;
} {
  /** 列定义查找表（columnKey → 定义），覆盖多级表头的分组子列 */
  const columnDefByKey = computed<Map<string, DataTableColumnDef<T>>>(() => {
    const map = new Map<string, DataTableColumnDef<T>>();

    /**
     * 递归收集分组子列。
     *
     * @param cols - 当前层列定义
     * @returns 无
     */
    function collect(cols: DataTableColumnDef<T>[]): void {
      for (const col of cols) {
        map.set(col.key, col);
        if (Array.isArray(col.children)) {
          collect(col.children as DataTableColumnDef<T>[]);
        }
      }
    }

    collect(columns());
    return map;
  });

  /**
   * 按 key 取列定义。
   *
   * @param columnKey - 列 key
   * @returns 列定义或 undefined
   */
  function findColumn(columnKey: string): DataTableColumnDef<T> | undefined {
    return columnDefByKey.value.get(columnKey);
  }

  return { columnDefByKey, findColumn };
}
