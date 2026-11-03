/**
 * useTreeExpand —— YdTreeTable 展开 / 收起状态 + 懒加载协调。
 *
 * <p>职责：
 * <ul>
 *   <li>内部展开 keys 状态管理（受控 / 非受控）</li>
 *   <li>expandKey / collapseKey / toggleExpand / expandAll / collapseAll</li>
 *   <li>懒加载协调（loadingKeys + lazyChildrenMap + loadData）</li>
 *   <li>handleToggleExpand / handleLazyLoad</li>
 * </ul>
 *
 * <p>从 use-tree-table-core 提取，保持对外行为不变。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\tree-table\use-tree-expand.ts
 * @author ydsz-team
 * @since 26.10.17
 */

import type { TreeFlatRow, YdTreeTableEmits } from './types';
import type { ResolvedTreeTableProps } from './tree-table-shared-types';
import type { ComputedRef, Ref } from 'vue';

import { ref, watch } from 'vue';

/** useTreeExpand 配置 */
export interface UseTreeExpandOptions<T extends Record<string, unknown>> {
  /** 组件 props（响应式，已含默认值） */
  props: ResolvedTreeTableProps<T>;
  /** 组件 emits 触发器 */
  emit: YdTreeTableEmits;
  /** key -> 节点映射 */
  nodeMap: ComputedRef<Map<string, T>>;
  /** 获取节点的有效子节点（含懒加载追加的） */
  getEffectiveChildren: (row: T, key: string) => T[];
  /** 懒加载追加的子节点映射（key -> children） */
  lazyChildrenMap: Ref<Record<string, T[]>>;
  /** 内部展开 keys（由组合入口持有并共享） */
  internalExpandedKeys: Ref<Set<string>>;
}

/** useTreeExpand 返回句柄 */
export interface UseTreeExpandReturn<T extends Record<string, unknown> = Record<string, unknown>> {
  /** 内部 loading key 集合 */
  internalLoadingKeys: Ref<Set<string>>;
  /** 展开指定 key */
  expandKey: (key: string) => void;
  /** 收起指定 key */
  collapseKey: (key: string) => void;
  /** 切换展开 / 收起 */
  toggleExpand: (key: string) => void;
  /** 展开全部 */
  expandAll: () => void;
  /** 收起全部 */
  collapseAll: () => void;
  /** 展开指定节点（expose 别名） */
  expandNode: (key: string) => void;
  /** 收起指定节点（expose 别名） */
  collapseNode: (key: string) => void;
  /** 点击展开 / 折叠图标（含懒加载） */
  handleToggleExpand: (flatRow: TreeFlatRow<T>) => void;
  /** 懒加载节点 */
  handleLazyLoad: (key: string) => Promise<void>;
  /** 节点是否加载中 */
  isNodeLoading: (key: string) => boolean;
}

/**
 * 展开 / 收起状态 + 懒加载协调 composable。
 *
 * @param options - props / emit / nodeMap / getEffectiveChildren / lazyChildrenMap / internalExpandedKeys
 * @returns 展开态句柄
 */
export function useTreeExpand<T extends Record<string, unknown>>(
  options: UseTreeExpandOptions<T>,
): UseTreeExpandReturn<T> {
  const { emit, props, nodeMap, getEffectiveChildren, lazyChildrenMap, internalExpandedKeys } = options;

  /** 懒加载内部 loading key 集合 */
  const internalLoadingKeys = ref<Set<string>>(new Set());

  /** 响应 props.defaultExpandedKeys 变化 */
  watch(
    () => props.defaultExpandedKeys,
    (keys) => {
      internalExpandedKeys.value = new Set(keys);
    },
  );

  function expandKey(key: string): void {
    if (internalExpandedKeys.value.has(key)) return;
    const next = new Set(internalExpandedKeys.value);
    next.add(key);
    internalExpandedKeys.value = next;
    emit('update:expandedKeys', Array.from(next));
    const node = nodeMap.value.get(key);
    if (node) emit('expand', key, node);
  }

  function collapseKey(key: string): void {
    if (!internalExpandedKeys.value.has(key)) return;
    const next = new Set(internalExpandedKeys.value);
    next.delete(key);
    internalExpandedKeys.value = next;
    emit('update:expandedKeys', Array.from(next));
    const node = nodeMap.value.get(key);
    if (node) emit('collapse', key, node);
  }

  function toggleExpand(key: string): void {
    if (internalExpandedKeys.value.has(key)) {
      collapseKey(key);
    } else {
      expandKey(key);
    }
  }

  function expandAll(): void {
    const allKeys = new Set<string>();
    function collect(list: T[]): void {
      for (const row of list) {
        const key = String((row as Record<string, unknown>)[props.rowKey]);
        const children = getEffectiveChildren(row, key);
        if (children.length > 0) {
          allKeys.add(key);
          collect(children);
        }
      }
    }
    collect(props.dataSource);
    internalExpandedKeys.value = allKeys;
    emit('update:expandedKeys', Array.from(allKeys));
  }

  function collapseAll(): void {
    internalExpandedKeys.value = new Set();
    emit('update:expandedKeys', []);
  }

  function expandNode(key: string): void {
    expandKey(key);
  }

  function collapseNode(key: string): void {
    collapseKey(key);
  }

  /* ---------------------------------------------------------- */
  /* Lazy Load                                                  */
  /* ---------------------------------------------------------- */

  async function handleLazyLoad(key: string): Promise<void> {
    if (!props.lazy || !props.loadData) return;
    const node = nodeMap.value.get(key);
    if (!node) return;

    // 已有有效子节点 → 直接展开，不再加载
    const children = getEffectiveChildren(node, key);
    if (children.length > 0) {
      expandKey(key);
      return;
    }

    // 开始加载
    internalLoadingKeys.value = new Set(internalLoadingKeys.value).add(key);
    try {
      const loaded = await props.loadData(node);
      if (Array.isArray(loaded) && loaded.length > 0) {
        lazyChildrenMap.value = {
          ...lazyChildrenMap.value,
          [key]: [...(lazyChildrenMap.value[key] ?? []), ...loaded],
        };
        emit('load-success', key, loaded);
      }
      expandKey(key);
    } finally {
      const nextLoading = new Set(internalLoadingKeys.value);
      nextLoading.delete(key);
      internalLoadingKeys.value = nextLoading;
    }
  }

  function handleToggleExpand(flatRow: TreeFlatRow<T>): void {
    if (!flatRow.hasChildren && props.lazy) {
      void handleLazyLoad(flatRow.key);
      return;
    }
    if (internalExpandedKeys.value.has(flatRow.key)) {
      collapseKey(flatRow.key);
    } else {
      expandKey(flatRow.key);
    }
  }

  function isNodeLoading(key: string): boolean {
    return (
      internalLoadingKeys.value.has(key) ||
      (props.loadingKeys ?? []).includes(key)
    );
  }

  return {
    collapseAll,
    collapseKey,
    collapseNode,
    expandAll,
    expandKey,
    expandNode,
    handleLazyLoad,
    handleToggleExpand,
    internalLoadingKeys,
    isNodeLoading,
    toggleExpand,
  };
}
