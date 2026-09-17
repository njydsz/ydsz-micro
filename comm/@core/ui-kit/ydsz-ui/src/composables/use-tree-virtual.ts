/**
 * useTreeVirtual —— 树形组件虚拟滚动调度 composable。
 *
 * <p>将树的扁平化节点（由 useTreeHeadless 提供）与 useVirtualList 衔接，
 * 仅渲染当前视口可见的节点，避免深层树的全量 DOM 开销。
 *
 * <p>与 useTreeHeadless 的协作边界：
 * <ul>
 *   <li>useTreeHeadless 负责：展开/折叠/选中/级联逻辑，输出 flattenedNodes</li>
 *   <li>useTreeVirtual 负责：基于 flattenedNodes + expandedKeys 计算可见区间</li>
 * </ul>
 *
 * <p>懒加载支持：当节点标记 isLazy 且未加载时，触发 onLazyLoad 回调；
 * 调用方异步回填 children 后重置 isLazy 标记。
 *
 * <p>典型用法：
 * <pre>
 *   const tree = useTreeHeadless({ treeData, ... });
 *   const virtual = useTreeVirtual({
 *     flattenedNodes: () => tree.flattenedNodes,
 *     expandedKeys: tree.expandedKeys,
 *     viewportHeight: 300,
 *     onLazyLoad: (node) => api.loadChildren(node.id).then(...)
 *   });
 * </pre>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-tree-virtual.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import type { MaybeRef } from 'vue';

import { computed, ref, unref, watch, type Ref } from 'vue';

/** 扁平化节点（由 useTreeHeadless 输出结构） */
export interface FlatTreeNode {
  data: unknown;
  hasChildren: boolean;
  isLeaf?: boolean;
  isLoaded?: boolean;
  level: number;
  parents: Array<string | number>;
  value: string | number;
}

/** 懒加载回调上下文 */
export interface LazyLoadContext<T = unknown> {
  /** 节点原始数据 */
  data: T;
  /** 节点 value */
  value: string | number;
  /** 节点层级 */
  level: number;
}

/** 配置项 */
export interface UseTreeVirtualOptions {
  /** 扁平化节点 getter（依赖展开态自动重算） */
  flattenedNodes: MaybeRef<FlatTreeNode[]> | (() => FlatTreeNode[]);
  /** 当前展开的 value 集合 */
  expandedKeys: Ref<Set<string | number>> | MaybeRef<Set<string | number>>;
  /** 视口高度（px），默认 300 */
  viewportHeight?: number;
  /** 行高（px），默认 28 */
  itemHeight?: number;
  /** 上下缓冲行数，默认 5 */
  overscan?: number;
  /** 懒加载回调（异步回填子节点） */
  onLazyLoad?: (ctx: LazyLoadContext) => void | Promise<void>;
}

/** 可见节点描述 */
export interface VirtualTreeNode {
  data: FlatTreeNode;
  index: number;
  key: string | number;
  offsetY: number;
}

/** composable 返回句柄 */
export interface TreeVirtualHandle {
  /** 过滤后的可见节点（仅展开祖先的节点） */
  expandedVisibleNodes: Ref<FlatTreeNode[]>;
  /** 当前视口应渲染的节点切片 */
  visibleSlice: Ref<VirtualTreeNode[]>;
  /** 列表总高度 */
  totalHeight: Ref<number>;
  /** 容器滚动样式 */
  containerStyle: Ref<Record<string, string>>;
  /** spacer 占位样式 */
  spacerStyle: Ref<Record<string, string>>;
  /** 当前偏移量 translateY */
  offsetY: Ref<number>;
  /** 滚动事件处理 */
  onScroll: (event: Event) => void;
  /** 手动触发节点懒加载 */
  loadLazyNode: (value: string | number) => Promise<void>;
}

/**
 * useTreeVirtual：树形虚拟滚动调度。
 *
 * @param options - 配置项
 * @return 虚拟滚动句柄
 */
export function useTreeVirtual(options: UseTreeVirtualOptions): TreeVirtualHandle {
  const {
    flattenedNodes,
    expandedKeys,
    viewportHeight = 300,
    itemHeight = 28,
    overscan = 5,
    onLazyLoad,
  } = options;

  const scrollTop = ref(0);

  /** 读取扁平化节点数组 */
  const resolvedNodes = computed((): FlatTreeNode[] => {
    if (typeof flattenedNodes === 'function') return flattenedNodes();
    return unref(flattenedNodes);
  });

  /** 读取展开集合 */
  const resolvedExpandedKeys = computed((): Set<string | number> => {
    if ('value' in expandedKeys && !(expandedKeys instanceof Set)) {
      // ref
      return (expandedKeys as Ref<Set<string | number>>).value;
    }
    return unref(expandedKeys as MaybeRef<Set<string | number>>);
  });

  /**
   * 过滤出「所有祖先均已展开」的节点。
   * 任一级祖先未展开，则该节点不可见。
   */
  const expandedVisibleNodes = computed<FlatTreeNode[]>(() => {
    const nodes = resolvedNodes.value;
    const expanded = resolvedExpandedKeys.value;
    const result: FlatTreeNode[] = [];

    for (const node of nodes) {
      // 根节点（无父级）始终可见
      if (node.parents.length === 0) {
        result.push(node);
        continue;
      }
      // 检查所有祖先是否都已展开
      const allAncestorsExpanded = node.parents.every((parentValue) =>
        expanded.has(parentValue),
      );
      if (allAncestorsExpanded) {
        result.push(node);
      }
    }
    return result;
  });

  /** 总高度 */
  const totalHeight = computed<number>(
    () => expandedVisibleNodes.value.length * itemHeight,
  );

  /** 可见起始索引 */
  const startIndex = computed(() =>
    Math.max(0, Math.floor(scrollTop.value / itemHeight) - overscan),
  );

  /** 可见结束索引 */
  const endIndex = computed(() => {
    const visibleCount = Math.ceil(viewportHeight / itemHeight);
    return Math.min(
      expandedVisibleNodes.value.length,
      startIndex.value + visibleCount + overscan * 2,
    );
  });

  /** 可见切片 */
  const visibleSlice = computed<VirtualTreeNode[]>(() => {
    const nodes = expandedVisibleNodes.value;
    const slice: VirtualTreeNode[] = [];
    const start = startIndex.value;
    const end = endIndex.value;

    for (let i = start; i < end; i++) {
      const node = nodes[i];
      if (!node) continue;
      slice.push({
        data: node,
        index: i,
        key: node.value,
        offsetY: i * itemHeight,
      });
    }
    return slice;
  });

  /** 偏移量 */
  const offsetY = computed(() => startIndex.value * itemHeight);

  /** 容器滚动样式 */
  const containerStyle = ref<Record<string, string>>({
    height: `${viewportHeight}px`,
    overflowY: 'auto',
    position: 'relative',
  });

  /** 占位层样式 */
  const spacerStyle = computed<Record<string, string>>(() => ({
    height: `${totalHeight.value}px`,
    position: 'relative',
    width: '100%',
  }));

  /** 滚动事件 */
  function onScroll(event: Event): void {
    const target = event.target as HTMLElement | null;
    scrollTop.value = target?.scrollTop ?? 0;
  }

  /**
   * 触发指定节点的懒加载。
   * 调用方应在其回调中异步获取子节点后更新 treeData。
   *
   * @param value - 节点 value
   */
  async function loadLazyNode(value: string | number): Promise<void> {
    if (!onLazyLoad) return;
    const node = resolvedNodes.value.find((n) => n.value === value);
    if (!node) return;
    await onLazyLoad({
      data: node.data,
      level: node.level,
      value: node.value,
    });
  }

  return {
    containerStyle,
    expandedVisibleNodes,
    loadLazyNode,
    offsetY,
    onScroll,
    spacerStyle,
    totalHeight,
    visibleSlice,
  };
}
