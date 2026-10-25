/**
 * useTableRowView —— 行渲染序列装配（树形扁平化 + 行虚拟滚动）。
 *
 * <p>树形模式先把 children 递归摊平成 {@link TreeFlatRow}，再按可视区裁剪出
 * {@link RowView} 序列；未开启虚拟化时全量输出，两者共用同一份行视图结构，
 * 让模板只关心「渲染哪些行」而不必区分模式。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\data-table\use-table-row-view.ts
 * @author ydsz-team
 * @since 5.7.0
 */

import { computed, ref, toValue } from 'vue';

import { useVirtualizer } from '@tanstack/vue-virtual';

import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue';
import type { RowView, TreeConfig, TreeFlatRow } from './types';

/** 行高缺省值（像素） */
const DEFAULT_ROW_HEIGHT = 40;

/** useTableRowView 配置 */
export interface TableRowViewOptions<T extends Record<string, unknown>> {
  /** 已排序 / 筛选的视图行 */
  rows: MaybeRefOrGetter<T[]>;
  /** 行 key 获取函数 */
  rowKey: (row: T, index: number) => string;
  /** 树形配置（undefined 表示普通模式） */
  treeConfig?: MaybeRefOrGetter<TreeConfig | undefined>;
  /** 受控展开 key 列表 */
  expandedKeys?: MaybeRefOrGetter<string[] | undefined>;
  /** 是否开启行虚拟滚动 */
  virtual?: MaybeRefOrGetter<boolean>;
  /** 行高估算值（像素） */
  estimateRowHeight?: MaybeRefOrGetter<number>;
  /** 视口外预渲染行数 */
  overscan?: MaybeRefOrGetter<number>;
  /** 滚动容器 */
  scrollElement: () => Element | null;
  /** 展开状态变化（非受控模式） */
  onExpandedKeysChange?: (keys: string[]) => void;
}

/** useTableRowView 返回句柄 */
export interface TableRowViewResult<T> {
  /** 底部占位行高度（px） */
  bottomSpacerHeight: ComputedRef<number>;
  /** 参与汇总 / 导出的真实行集合（树形模式含子行） */
  dataRows: ComputedRef<T[]>;
  /** 当前生效的展开 key 集合 */
  expandedKeys: ComputedRef<Set<string>>;
  /** 渲染用行视图（已按可视区裁剪） */
  rowViews: ComputedRef<RowView<T>[]>;
  /** 展开 / 收起某行 */
  toggleExpand: (key: string) => void;
  /** 未裁剪的总行数（空态判定与 aria-rowcount 使用） */
  rowCount: ComputedRef<number>;
  /** 顶部占位行高度（px） */
  topSpacerHeight: ComputedRef<number>;
  /** 是否处于虚拟滚动状态（决定占位行与吸顶样式） */
  virtualized: ComputedRef<boolean>;
}

/**
 * 装配行渲染序列。
 *
 * @param options - 行视图配置
 * @returns 行视图与展开状态句柄
 */
export function useTableRowView<T extends Record<string, unknown>>(
  options: TableRowViewOptions<T>,
): TableRowViewResult<T> {
  const treeConfig = computed<TreeConfig | undefined>(() => toValue(options.treeConfig));

  const isTreeMode = computed<boolean>(() => treeConfig.value !== undefined);

  /** 非受控模式的展开集合 */
  const internalExpandedKeys: Ref<Set<string>> = ref(
    new Set(treeConfig.value?.defaultExpandedKeys ?? []),
  );

  const expandedKeys = computed<Set<string>>(() => {
    const controlled = toValue(options.expandedKeys);
    return controlled ? new Set(controlled) : internalExpandedKeys.value;
  });

  /**
   * 切换展开 / 收起。
   *
   * @param key - 行 key
   * @returns 无
   */
  function toggleExpand(key: string): void {
    const next = new Set(expandedKeys.value);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    internalExpandedKeys.value = next;
    options.onExpandedKeysChange?.(Array.from(next));
  }

  /** 树形扁平化行 */
  const treeFlatRows = computed<TreeFlatRow<T>[]>(() => {
    const config = treeConfig.value;
    if (!config) return [];
    const childrenKey = config.childrenKey ?? 'children';
    const result: TreeFlatRow<T>[] = [];

    /**
     * 递归摊平子节点，仅展开的分支继续下钻。
     *
     * @param list - 当前层节点
     * @param depth - 当前层级
     * @returns 无
     */
    function flatten(list: T[], depth: number): void {
      for (const item of list) {
        const key = options.rowKey(item, result.length);
        const kids = (item as Record<string, unknown>)[childrenKey] as T[] | undefined;
        const hasChildren = Array.isArray(kids) && kids.length > 0;
        result.push({ depth, hasChildren, key, row: item });
        if (hasChildren && expandedKeys.value.has(key)) {
          flatten(kids, depth + 1);
        }
      }
    }

    flatten(toValue(options.rows), 0);
    return result;
  });

  /** 完整渲染序列（未裁剪） */
  const fullRows = computed<RowView<T>[]>(() => {
    if (isTreeMode.value) {
      return treeFlatRows.value.map(node => ({
        index: 0,
        key: node.key,
        node,
        row: node.row,
      }));
    }
    return toValue(options.rows).map((row, index) => ({
      index,
      key: options.rowKey(row, index),
      row,
    }));
  });

  /** 回填真实下标（树形模式下摊平顺序即渲染顺序） */
  const indexedRows = computed<RowView<T>[]>(() =>
    fullRows.value.map((view, index) => ({ ...view, index })),
  );

  const virtualized = computed<boolean>(
    () => (toValue(options.virtual) ?? false) && indexedRows.value.length > 0,
  );

  const rowVirtualizer = useVirtualizer(
    computed(() => ({
      count: indexedRows.value.length,
      enabled: virtualized.value,
      estimateSize: () => toValue(options.estimateRowHeight) ?? DEFAULT_ROW_HEIGHT,
      getScrollElement: () => options.scrollElement(),
      overscan: toValue(options.overscan) ?? 8,
    })),
  );

  const rowViews = computed<RowView<T>[]>(() => {
    const rows = indexedRows.value;
    if (!virtualized.value) return rows;
    return rowVirtualizer.value
      .getVirtualItems()
      .map(item => rows[item.index])
      .filter((view): view is RowView<T> => view !== undefined);
  });

  const topSpacerHeight = computed<number>(() => {
    if (!virtualized.value) return 0;
    return rowVirtualizer.value.getVirtualItems()[0]?.start ?? 0;
  });

  const bottomSpacerHeight = computed<number>(() => {
    if (!virtualized.value) return 0;
    const items = rowVirtualizer.value.getVirtualItems();
    const last = items[items.length - 1];
    if (!last) return 0;
    return Math.max(0, rowVirtualizer.value.getTotalSize() - last.end);
  });

  const dataRows = computed<T[]>(() => indexedRows.value.map(view => view.row));

  return {
    bottomSpacerHeight,
    dataRows,
    expandedKeys,
    rowCount: computed<number>(() => indexedRows.value.length),
    rowViews,
    toggleExpand,
    topSpacerHeight,
    virtualized,
  };
}
