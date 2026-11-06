/**
 * useTreeSelection —— YdTreeTable 复选框父子级联选择。
 *
 * <p>职责：
 * <ul>
 *   <li>勾选状态管理（checkedKeys / halfCheckedKeys）</li>
 *   <li>父子级联选择（checkStrictly 独立模式）</li>
 *   <li>半选态计算（recomputeHalfChecked）</li>
 *   <li>子孙 / 祖先 key 计算</li>
 *   <li>toggleCheckbox / isChecked / isHalfChecked / getCheckedNodes / getHalfCheckedNodes</li>
 * </ul>
 *
 * <p>从 use-tree-table-core 提取，保持对外行为不变。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\tree-table\use-tree-selection.ts
 * @author ydsz-team
 * @since 26.10.17
 */

import type { TreeFlatRow, YdTreeTableEmits } from './types';
import type { ResolvedTreeTableProps } from './tree-table-shared-types';
import type { ComputedRef } from 'vue';

import { ref, watch } from 'vue';

/** useTreeSelection 配置 */
export interface UseTreeSelectionOptions<T extends Record<string, unknown>> {
  /** 组件 props（响应式，已含默认值） */
  props: ResolvedTreeTableProps<T>;
  /** 组件 emits 触发器 */
  emit: YdTreeTableEmits;
  /** key -> 节点映射 */
  nodeMap: ComputedRef<Map<string, T>>;
  /** 获取节点的有效子节点（含懒加载追加的） */
  getEffectiveChildren: (row: T, key: string) => T[];
  /** 当前可见扁平行 */
  flatRows: ComputedRef<TreeFlatRow<T>[]>;
}

/** useTreeSelection 返回句柄 */
export interface UseTreeSelectionReturn<T extends Record<string, unknown>> {
  /** 重新计算半选状态 */
  recomputeHalfChecked: () => void;
  /** 是否已勾选 */
  isChecked: (key: string) => boolean;
  /** 是否半选 */
  isHalfChecked: (key: string) => boolean;
  /** 切换复选框（含级联） */
  toggleCheckbox: (flatRow: TreeFlatRow<T>) => void;
  /** 获取已勾选节点 */
  getCheckedNodes: () => T[];
  /** 获取半选节点 */
  getHalfCheckedNodes: () => T[];
}

/**
 * 复选框级联选择 composable。
 *
 * @param options - props / emit / nodeMap / getEffectiveChildren / flatRows
 * @returns 选择态句柄
 */
export function useTreeSelection<T extends Record<string, unknown>>(
  options: UseTreeSelectionOptions<T>,
): UseTreeSelectionReturn<T> {
  const { emit, props, nodeMap, getEffectiveChildren, flatRows } = options;

  /** 勾选 keys 集合 */
  const checkedKeys = ref<Set<string>>(new Set(props.defaultCheckedKeys));

  /** 半选 keys 集合（子节点部分选中） */
  const halfCheckedKeys = ref<Set<string>>(new Set());

  /** 响应 props.defaultCheckedKeys 变化 */
  watch(
    () => props.defaultCheckedKeys,
    (keys) => {
      checkedKeys.value = new Set(keys);
      halfCheckedKeys.value = new Set();
      recomputeHalfChecked();
    },
  );

  /** 重新计算半选状态 */
  function recomputeHalfChecked(): void {
    if (props.checkStrictly) {
      halfCheckedKeys.value = new Set();
      return;
    }
    const newHalf = new Set<string>();
    const currentChecked = checkedKeys.value;

    // 从每个叶子往上检查
    for (const row of flatRows.value) {
      if (!row.hasChildren) continue;
      const children = getEffectiveChildren(row.row, row.key);
      const childKeys = children.map((c) => String((c as Record<string, unknown>)[props.rowKey]));
      const checkedCount = childKeys.filter((k) => currentChecked.has(k)).length;
      if (checkedCount > 0 && checkedCount < childKeys.length) {
        newHalf.add(row.key);
      }
      if (checkedCount === childKeys.length && !currentChecked.has(row.key)) {
        // 所有子节点被选中但本节点未选中
        newHalf.add(row.key);
      }
    }

    halfCheckedKeys.value = newHalf;
  }

  /** 获取节点的所有子孙 key */
  function getDescendantKeys(row: T, key: string): string[] {
    const result: string[] = [];
    function collect(children: T[]): void {
      for (const child of children) {
        const ck = String((child as Record<string, unknown>)[props.rowKey]);
        result.push(ck);
        const grandChildren = getEffectiveChildren(child, ck);
        if (grandChildren.length > 0) collect(grandChildren);
      }
    }
    const directChildren = getEffectiveChildren(row, key);
    collect(directChildren);
    return result;
  }

  /** 获取节点的所有祖先 key */
  function getAncestorKeys(flatRow: TreeFlatRow<T>): string[] {
    return flatRow.ancestorKeys;
  }

  function toggleCheckbox(flatRow: TreeFlatRow<T>): void {
    const key = flatRow.key;
    const isChecked = checkedKeys.value.has(key);
    const nextChecked = new Set(checkedKeys.value);

    if (isChecked) {
      nextChecked.delete(key);
    } else {
      nextChecked.add(key);
    }

    if (!props.checkStrictly) {
      // 级联子孙
      const descKeys = getDescendantKeys(flatRow.row, key);
      if (isChecked) {
        descKeys.forEach((k) => nextChecked.delete(k));
      } else {
        descKeys.forEach((k) => nextChecked.add(k));
      }

      // 级联祖先
      const ancestors = getAncestorKeys(flatRow);
      for (let i = ancestors.length - 1; i >= 0; i--) {
        const ancestorKey = ancestors[i]!;
        // 获取祖先节点
        const ancestorRow = flatRows.value.find((r) => r.key === ancestorKey);
        if (!ancestorRow) continue;
        const siblingChildren = getEffectiveChildren(ancestorRow.row, ancestorKey);
        const siblingKeys = siblingChildren.map((c) =>
          String((c as Record<string, unknown>)[props.rowKey]),
        );
        const allChecked = siblingKeys.every((k) => nextChecked.has(k));
        if (allChecked) {
          nextChecked.add(ancestorKey);
        } else {
          nextChecked.delete(ancestorKey);
        }
      }
    }

    checkedKeys.value = nextChecked;
    recomputeHalfChecked();
    emit('check-change', Array.from(nextChecked), Array.from(halfCheckedKeys.value));
  }

  function isChecked(key: string): boolean {
    return checkedKeys.value.has(key);
  }

  function isHalfChecked(key: string): boolean {
    return halfCheckedKeys.value.has(key);
  }

  function getCheckedNodes(): T[] {
    return Array.from(checkedKeys.value)
      .map((k) => nodeMap.value.get(k))
      .filter((n): n is T => n !== undefined);
  }

  function getHalfCheckedNodes(): T[] {
    return Array.from(halfCheckedKeys.value)
      .map((k) => nodeMap.value.get(k))
      .filter((n): n is T => n !== undefined);
  }

  return {
    getCheckedNodes,
    getHalfCheckedNodes,
    isChecked,
    isHalfChecked,
    recomputeHalfChecked,
    toggleCheckbox,
  };
}
