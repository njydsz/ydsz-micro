/**
 * 表格排序与列宽拖拽交互。
 *
 * <p>从 YdDataTable.vue 抽离，控制单文件脚本行数（SFC-006）。
 * 排序负责把内部 sortChain 变化广播给受控调用方；
 * 列宽拖拽委托 useTableResizePersistence，仅在 pointerdown 时接管。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\data-table\use-table-sort-and-resize.ts
 * @author ydsz-team
 * @since 26.11.06
 */
import type { SortOrder, UseTableDataReturn } from '../../composables/use-table-data';

import { watch } from 'vue';

import { useTableResizePersistence } from './use-table-resize-persistence';

/** 排序变化事件载荷 */
export interface SortChangeEmit {
  (event: 'sort-change', prop: string, order: SortOrder | null): void;
  (event: 'sort-chain-change', chain: Array<{ prop: string; order: SortOrder }>): void;
  (event: 'update:sortState', state: { order: SortOrder | null; prop: string | null }): void;
}

/**
 * 表格排序 + 列宽拖拽组合式函数。
 *
 * @param table - useTableData 返回的表格数据对象
 * @param emit - 组件 emit（由调用方传入，保持类型安全）
 * @param options - 配置项
 * @returns 排序与列宽相关 API
 */
export function useTableSortAndResize<T extends Record<string, unknown>>(
  table: UseTableDataReturn<T>,
  emit: SortChangeEmit,
  options: {
    /** 受控排序状态（外部 sortState prop） */
    sortState?: () => { order: SortOrder | null; prop: string | null } | undefined;
    /** 列宽持久化 storage key */
    storageKey?: string;
    /** 是否允许列宽拖拽 */
    resizable?: () => boolean;
  },
) {
  /** 受控排序：外部 sortState 变化时覆盖内部排序链 */
  if (options.sortState) {
    watch(
      () => options.sortState?.(),
      (next) => {
        if (!next) return;
        table.sortState.value = { order: next.order, prop: next.prop };
      },
      { immediate: true },
    );
  }

  /** 把内部排序链变化广播给受控调用方 */
  function emitSortState(): void {
    const chain = table.sortChain.value;
    const primary = chain[0];
    emit('sort-change', primary?.prop ?? '', primary?.order ?? null);
    emit('sort-chain-change', [...chain]);
    emit(
      'update:sortState',
      primary ? { order: primary.order, prop: primary.prop } : { order: null, prop: null },
    );
  }

  /**
   * 表头点击排序：修饰键表示追加到多列排序链，否则替换当前排序。
   *
   * @param columnKey - 被点击的列 key
   * @param additive - 是否携带 Shift / Ctrl / Meta
   * @returns 无
   */
  function handleSort(columnKey: string, additive: boolean): void {
    table.toggleSort(columnKey, additive);
    emitSortState();
  }

  /**
   * 清空排序并同步受控事件。
   *
   * @returns 无
   */
  function clearSort(): void {
    table.clearSort();
    emitSortState();
  }

  /** 列宽持久化与拖拽 */
  const resizePersistence = useTableResizePersistence<T>(options.storageKey);

  /**
   * 开始列宽拖拽。
   *
   * @param columnKey - 列 key
   * @param event - 原生指针事件
   * @param onResize - 列宽变化回调
   * @returns 无
   */
  function handleResizeStart(
    columnKey: string,
    event: PointerEvent,
    onResize: (key: string, newWidth: number) => void,
  ): void {
    if (!options.resizable?.()) return;
    resizePersistence.handleResizeStart(columnKey, event, onResize);
  }

  return {
    handleSort,
    clearSort,
    emitSortState,
    resizePersistence,
    handleResizeStart,
  };
}
