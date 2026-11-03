/**
 * useTreeFlatten —— YdTreeTable 树形扁平化 + 节点映射。
 *
 * <p>职责：
 * <ul>
 *   <li>获取节点有效子节点（含懒加载追加）</li>
 *   <li>构建 key → 节点映射（nodeMap）</li>
 *   <li>递归扁平化树为可见行（flatRows）</li>
 * </ul>
 *
 * <p>从 use-tree-table-core 提取，保持对外行为不变。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\tree-table\use-tree-flatten.ts
 * @author ydsz-team
 * @since 26.10.17
 */

import type { TreeFlatRow } from './types';
import type { ResolvedTreeTableProps } from './tree-table-shared-types';
import type { ComputedRef, Ref } from 'vue';

import { computed } from 'vue';

/** useTreeFlatten 配置 */
export interface UseTreeFlattenOptions<T extends Record<string, unknown>> {
  /** 组件 props（响应式，已含默认值） */
  props: ResolvedTreeTableProps<T>;
  /** 懒加载追加的子节点映射（key -> children） */
  lazyChildrenMap: Ref<Record<string, T[]>>;
  /** 内部展开 keys */
  expandedKeys: Ref<Set<string>>;
}

/** useTreeFlatten 返回句柄 */
export interface UseTreeFlattenReturn<T extends Record<string, unknown>> {
  /** 当前可见扁平行 */
  flatRows: ComputedRef<TreeFlatRow<T>[]>;
  /** key -> 节点映射 */
  nodeMap: ComputedRef<Map<string, T>>;
  /** 获取节点的有效子节点（含懒加载追加的） */
  getEffectiveChildren: (row: T, key: string) => T[];
  /** 构建 key -> 节点映射 */
  buildNodeMap: (data: T[]) => Map<string, T>;
}

/**
 * 树形扁平化 composable。
 *
 * @param options - props / lazyChildrenMap / expandedKeys
 * @returns 扁平化句柄
 */
export function useTreeFlatten<T extends Record<string, unknown>>(
  options: UseTreeFlattenOptions<T>,
): UseTreeFlattenReturn<T> {
  const { props, lazyChildrenMap, expandedKeys } = options;

  /** 获取节点的有效子节点（含懒加载追加的） */
  function getEffectiveChildren(row: T, key: string): T[] {
    const raw = (row as Record<string, unknown>)[props.childrenKey] as T[] | undefined;
    const base = Array.isArray(raw) ? raw : [];
    const lazy = lazyChildrenMap.value[key];
    return lazy ? [...base, ...lazy] : base;
  }

  /** 构建 key -> 节点映射（含懒加载追加子节点） */
  function buildNodeMap(data: T[]): Map<string, T> {
    const map = new Map<string, T>();
    function traverse(list: T[]): void {
      for (const item of list) {
        const key = String((item as Record<string, unknown>)[props.rowKey]);
        map.set(key, item);
        const children = (item as Record<string, unknown>)[props.childrenKey] as T[] | undefined;
        if (Array.isArray(children) && children.length > 0) {
          traverse(children);
        }
        // 懒加载追加的子节点
        const lazy = lazyChildrenMap.value[key];
        if (lazy) traverse(lazy);
      }
    }
    traverse(data);
    return map;
  }

  const nodeMap = computed<Map<string, T>>(() =>
    buildNodeMap(props.dataSource),
  );

  /** 递归扁平化 */
  function flattenTree(
    list: T[],
    depth: number,
    parentKey: string | null,
    ancestorKeys: string[],
    expandedSet: Set<string>,
  ): TreeFlatRow<T>[] {
    const result: TreeFlatRow<T>[] = [];
    for (const row of list) {
      const key = String((row as Record<string, unknown>)[props.rowKey]);
      const children = getEffectiveChildren(row, key);
      const hasChildren = children.length > 0;
      result.push({
        ancestorKeys,
        depth,
        hasChildren,
        key,
        parentKey,
        row,
      });
      if (hasChildren && expandedSet.has(key)) {
        result.push(
          ...flattenTree(
            children,
            depth + 1,
            key,
            [...ancestorKeys, key],
            expandedSet,
          ),
        );
      }
    }
    return result;
  }

  /** 当前可见扁平行 */
  const flatRows = computed<TreeFlatRow<T>[]>(() =>
    flattenTree(
      props.dataSource,
      0,
      null,
      [],
      expandedKeys.value,
    ),
  );

  return {
    buildNodeMap,
    flatRows,
    getEffectiveChildren,
    nodeMap,
  };
}
