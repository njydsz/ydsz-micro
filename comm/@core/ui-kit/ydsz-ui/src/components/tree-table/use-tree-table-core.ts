/**
 * useTreeTableCore —— YdTreeTable 脚本核心逻辑组合入口。
 *
 * <p>从 {@link YdTreeTable.vue} 提取，并按职责拆分为多个子模块：
 * <ul>
 *   <li>{@link ./tree-table-utils} —— 纯函数（alignClass / 单元格取值 / 缩进 / 列视图）</li>
 *   <li>{@link ./use-tree-flatten} —— 树形扁平化 + 节点映射 + 有效子节点</li>
 *   <li>{@link ./use-tree-expand} —— 展开 / 收起状态 + 懒加载协调</li>
 *   <li>{@link ./use-tree-selection} —— 复选框父子级联选择 + 半选态</li>
 *   <li>{@link ./use-tree-drag} —— 拖拽排序装配</li>
 *   <li>{@link ./tree-table-shared-types} —— 模块间共享类型</li>
 * </ul>
 *
 * <p>本文件作为组合入口，re-export 子模块并对齐对外 API，
 * 行为契约（props / emits / expose）完全不变。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\tree-table\use-tree-table-core.ts
 * @author ydsz-team
 * @since 26.10.17
 */

import type { TreeFlatRow } from './types';
import type { UseTreeTableCoreOptions, UseTreeTableCoreReturn } from './tree-table-shared-types';

import { computed, ref } from 'vue';

import {
  alignClass,
  formatCellValue,
  getCellValue,
  indentStyle as indentStyleFn,
  toRenderColumns,
} from './tree-table-utils';
import { useTreeDrag } from './use-tree-drag';
import { useTreeExpand } from './use-tree-expand';
import { useTreeFlatten } from './use-tree-flatten';
import { useTreeSelection } from './use-tree-selection';

/* ============================================================ */
/* Re-export（保持对外导出路径不变）                               */
/* ============================================================ */

export type {
  ResolvedTreeTableProps,
  TreeTableCellColumn,
  TreeTableRenderColumn,
  UseTreeTableCoreOptions,
  UseTreeTableCoreReturn,
} from './tree-table-shared-types';

export { alignClass } from './tree-table-utils';

/* ============================================================ */
/* 主入口                                                        */
/* ============================================================ */

/**
 * 装配 YdTreeTable 的核心逻辑。
 *
 * @param options - props / emit
 * @returns 树表核心句柄
 */
export function useTreeTableCore<T extends Record<string, unknown>>(
  options: UseTreeTableCoreOptions<T>,
): UseTreeTableCoreReturn<T> {
  const { emit, props } = options;

  /** 展开 keys（非受控模式内部状态，由组合入口持有并共享给各子模块） */
  const internalExpandedKeys = ref<Set<string>>(new Set(props.defaultExpandedKeys));

  /** 懒加载后追加的子节点（key -> children） */
  const lazyChildrenMap = ref<Record<string, T[]>>({});

  /* ---------------------------------------------------------- */
  /* 扁平化（依赖 lazyChildrenMap + internalExpandedKeys）       */
  /* ---------------------------------------------------------- */

  const flattenApi = useTreeFlatten<T>({
    expandedKeys: internalExpandedKeys,
    lazyChildrenMap,
    props,
  });

  /* ---------------------------------------------------------- */
  /* 展开 / 收起 + 懒加载                                        */
  /* ---------------------------------------------------------- */

  const expandApi = useTreeExpand<T>({
    emit,
    getEffectiveChildren: flattenApi.getEffectiveChildren,
    internalExpandedKeys,
    lazyChildrenMap,
    nodeMap: flattenApi.nodeMap,
    props,
  });

  /* ---------------------------------------------------------- */
  /* 复选框级联选择                                              */
  /* ---------------------------------------------------------- */

  const selectionApi = useTreeSelection<T>({
    emit,
    flatRows: flattenApi.flatRows,
    getEffectiveChildren: flattenApi.getEffectiveChildren,
    nodeMap: flattenApi.nodeMap,
    props,
  });

  /* ---------------------------------------------------------- */
  /* 拖拽排序                                                    */
  /* ---------------------------------------------------------- */

  const dragApi = useTreeDrag<T>({
    emit,
    flatRows: flattenApi.flatRows,
    props,
  });

  /* ---------------------------------------------------------- */
  /* 渲染辅助                                                    */
  /* ---------------------------------------------------------- */

  const renderColumns = computed(() => toRenderColumns(props.columns));

  /** 缩进 style：根据 depth 计算 paddingLeft */
  function indentStyle(flatRow: TreeFlatRow<T>) {
    return indentStyleFn(flatRow.depth, props.indentSize);
  }

  /** 判断某一层祖先是否还有后续兄弟（决定是否画竖线） */
  function hasAncestorSibling(flatRow: TreeFlatRow<T>, depthLevel: number): boolean {
    if (depthLevel <= 0 || depthLevel > flatRow.ancestorKeys.length) return false;
    // 找到该层祖先节点
    const ancestorKey = flatRow.ancestorKeys[depthLevel - 1]!;
    const ancestorRow = flattenApi.flatRows.value.find((r) => r.key === ancestorKey);
    if (!ancestorRow) return false;
    // 祖先的父节点
    const grandParentKey = ancestorRow.parentKey;
    const siblings = grandParentKey
      ? flattenApi.getEffectiveChildren(
          flattenApi.flatRows.value.find((r) => r.key === grandParentKey)!.row,
          grandParentKey,
        )
      : props.dataSource;
    // 找到祖先在同辈中的位置
    const idx = siblings.findIndex(
      (s) => String((s as Record<string, unknown>)[props.rowKey]) === ancestorKey,
    );
    // 若祖先不是最后一个兄弟，则本层需画竖线
    return idx >= 0 && idx < siblings.length - 1;
  }

  /* ---------------------------------------------------------- */
  /* 组合返回                                                    */
  /* ---------------------------------------------------------- */

  return {
    alignClass,
    collapseAll: expandApi.collapseAll,
    collapseKey: expandApi.collapseKey,
    collapseNode: expandApi.collapseNode,
    expandAll: expandApi.expandAll,
    expandKey: expandApi.expandKey,
    expandNode: expandApi.expandNode,
    flatRows: flattenApi.flatRows,
    formatCellValue,
    fromIndex: dragApi.fromIndex,
    getCellValue,
    getCheckedNodes: selectionApi.getCheckedNodes,
    getHalfCheckedNodes: selectionApi.getHalfCheckedNodes,
    handleLazyLoad: expandApi.handleLazyLoad,
    handleToggleExpand: expandApi.handleToggleExpand,
    hasAncestorSibling,
    indentStyle,
    internalExpandedKeys,
    isChecked: selectionApi.isChecked,
    isDragging: dragApi.isDragging,
    isHalfChecked: selectionApi.isHalfChecked,
    isNodeLoading: expandApi.isNodeLoading,
    onCellPointerDown: dragApi.onCellPointerDown,
    renderColumns,
    toIndex: dragApi.toIndex,
    toggleCheckbox: selectionApi.toggleCheckbox,
    toggleExpand: expandApi.toggleExpand,
  };
}
