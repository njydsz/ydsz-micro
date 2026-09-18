/**
 * useRowExpand — 行展开/懒加载组合式 API。
 *
 * <p>管理父表的行展开状态和子数据懒加载。
 *
 * @path comm\@core\ui-kit\advanced-table\src\composables\use-row-expand.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { computed, ref } from 'vue';

/**
 * 行展开状态配置。
 */
export interface RowExpandOptions<T> {
  /** 获取行唯一 ID */
  getRowId: (row: T, index: number) => string;
  /** 异步加载子数据 */
  onLoadChildren?: (row: T, index: number) => Promise<unknown[]>;
}

/**
 * 行展开 composable。
 *
 * @param options 配置选项
 * @return 行展开状态和方法
 */
export function useRowExpand<T extends Record<string, unknown>>(
  options: RowExpandOptions<T>,
) {
  const { getRowId, onLoadChildren } = options;

  /** 已展开的行 ID 集合 */
  const expandedRowIds = ref<Set<string>>(new Set());

  /** 各行的加载状态 */
  const loadingStates = ref<Map<string, 'idle' | 'loading' | 'loaded' | 'error'>>(
    new Map(),
  );

  /** 各行子数据缓存 */
  const childrenCache = ref<Map<string, unknown[]>>(new Map());

  /** 是否已展开任意行 */
  const hasExpandedRows = computed<boolean>(
    () => expandedRowIds.value.size > 0,
  );

  /**
   * 切换行展开状态。
   *
   * @param row 行数据
   * @param index 行索引
   */
  async function toggleExpand(row: T, index: number): Promise<void> {
    const rowId = getRowId(row, index);
    if (expandedRowIds.value.has(rowId)) {
      expandedRowIds.value.delete(rowId);
      expandedRowIds.value = new Set(expandedRowIds.value);
      return;
    }

    expandedRowIds.value.add(rowId);
    expandedRowIds.value = new Set(expandedRowIds.value);

    // 懒加载子数据
    if (onLoadChildren && !childrenCache.value.has(rowId)) {
      loadingStates.value.set(rowId, 'loading');
      try {
        const children = await onLoadChildren(row, index);
        childrenCache.value.set(rowId, children);
        loadingStates.value.set(rowId, 'loaded');
      } catch {
        loadingStates.value.set(rowId, 'error');
      }
    }
  }

  /**
   * 判断行是否展开。
   */
  function isExpanded(rowId: string): boolean {
    return expandedRowIds.value.has(rowId);
  }

  /**
   * 获取行加载状态。
   */
  function getLoadingState(rowId: string): 'idle' | 'loading' | 'loaded' | 'error' {
    return loadingStates.value.get(rowId) ?? 'idle';
  }

  /**
   * 获取行子数据。
   */
  function getChildren(rowId: string): unknown[] {
    return childrenCache.value.get(rowId) ?? [];
  }

  /**
   * 折叠全部行。
   */
  function collapseAll(): void {
    expandedRowIds.value = new Set();
  }

  /**
   * 销毁行缓存数据。
   */
  function clearCache(rowId?: string): void {
    if (rowId) {
      childrenCache.value.delete(rowId);
      loadingStates.value.delete(rowId);
    } else {
      childrenCache.value.clear();
      loadingStates.value.clear();
    }
  }

  return {
    expandedRowIds,
    hasExpandedRows,
    toggleExpand,
    isExpanded,
    getLoadingState,
    getChildren,
    collapseAll,
    clearCache,
  };
}
