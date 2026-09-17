/**
 * 树形组件搜索/筛选 composable：扁平化后匹配并计算需要展开的祖先节点集合。
 *
 * 痛点：深层树中通过关键字搜索时，匹配到的深层节点可能因父级折叠而不可见；
 * 需要先定位到匹配节点，再将整条祖先链展开到可见态。
 *
 * <p>本 composable 提供：
 * <ul>
 *   <li>根据关键字过滤扁平化节点</li>
 *   <li>返回匹配节点的索引集合与必须展开的祖先 value 集合</li>
 *   <li>高亮匹配文本片段（返回起止位置，用于前端 mark 标签）</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\tree\use-tree-search.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { computed, ref, type Ref } from 'vue';

/**
 * 经过搜索过滤后的项信息。
 *
 * 携带匹配位置信息用于前端高亮。
 */
export interface FilteredTreeNode<T> {
  /** 原始节点数据 */
  data: T;
  /** 在扁平化数组中的索引 */
  index: number;
  /** 层级 */
  level: number;
  /** 是否有子节点 */
  hasChildren: boolean;
  /** 父级 value 数组（从根到直接父） */
  parents: Array<string | number>;
  /** label 上的匹配区间（无匹配则为 null） */
  matchRange: { start: number; end: number } | null;
  /** 节点 value */
  value: string | number;
  /** 节点 label */
  label: string;
}

/**
 * 搜索结果句柄。
 */
export interface TreeSearchHandle<T> {
  /** 过滤后的节点列表（包含 matchRange 信息） */
  results: Ref<FilteredTreeNode<T>[]>;
  /** 需要展开的 value 集合（保证结果节点可见） */
  expandKeys: Ref<Set<string | number>>;
  /** 实际执行过滤的函数（防抖后的搜索） */
  search: (keyword: string) => void;
  /** 清空搜索 */
  clear: () => void;
  /** 当前搜索关键字 */
  keyword: Ref<string>;
  /** 是否有搜索结果 */
  hasResults: Ref<boolean>;
}

/**
 * 搜索配置。
 */
export interface TreeSearchOptions<T> {
  /** 从节点提取 label 的函数 */
  getLabel: (node: T) => string;
  /** 从节点提取 value 的函数 */
  getValue: (node: T) => string | number;
  /** 从节点提取 children 的函数 */
  getChildren: (node: T) => T[] | undefined;
  /** 是否大小写敏感，默认 false */
  caseSensitive?: boolean;
  /** 最大匹配数量（用于提前终止），默认 1000 */
  maxResults?: number;
}

/**
 * useTreeSearch —— 对嵌套树数据做扁平化搜索，返回匹配项与需要展开的祖先集合。
 *
 * @param nodes - 响应式的树数据根节点数组
 * @param options - 搜索配置
 * @return 搜索句柄
 *
 * @example
 * ```ts
 * const { results, expandKeys, search } = useTreeSearch(
 *   () => treeData.value,
 *   {
 *     getLabel: (n) => n.name,
 *     getValue: (n) => n.id,
 *     getChildren: (n) => n.children,
 *   },
 * );
 * ```
 *
 * @since 1.0.0
 */
export function useTreeSearch<T>(
  nodes: Ref<T[]> | (() => T[]),
  options: TreeSearchOptions<T>,
): TreeSearchHandle<T> {
  const {
    getChildren,
    getLabel,
    getValue,
    caseSensitive = false,
    maxResults = 1000,
  } = options;

  const keyword = ref('');

  /** 扁平化节点记录 */
  interface FlatNode {
    data: T;
    level: number;
    parents: Array<string | number>;
    value: string | number;
    label: string;
    hasChildren: boolean;
  }

  /**
   * 递归扁平化树。
   *
   * @param items - 当前层节点数组
   * @param level - 当前层级（0-based）
   * @param parents - 祖先 value 数组
   * @return 扁平化后的节点数组   */
  function flatten(
    items: T[],
    level: number,
    parents: Array<string | number>,
  ): FlatNode[] {
    const result: FlatNode[] = [];
    for (const item of items) {
      const value = getValue(item);
      const label = getLabel(item);
      const children = getChildren(item);
      const hasChildren = Array.isArray(children) && children.length > 0;

      result.push({
        data: item,
        hasChildren,
        label,
        level,
        parents: [...parents],
        value,
      });

      if (hasChildren) {
        result.push(
          ...flatten(children!, level + 1, [...parents, value]),
        );
      }
    }
    return result;
  }

  /** 当前扁平化节点（依赖外部 nodes 变化重算） */
  const flattenedNodes = computed<FlatNode[]>(() => {
    const rawNodes = typeof nodes === 'function' ? nodes() : nodes.value;
    return flatten(rawNodes, 0, []);
  });

  /** 搜索结果 */
  const results = computed<FilteredTreeNode<T>[]>(() => {
    const kw = caseSensitive ? keyword.value : keyword.value.toLowerCase();
    if (!kw) {
      return [];
    }

    const allNodes = flattenedNodes.value;
    const matches: FilteredTreeNode<T>[] = [];
    const matchedParents = new Set<string | number>();

    for (let i = 0; i < allNodes.length; i++) {
      if (matches.length >= maxResults) break;
      const node = allNodes[i];
      const labelToMatch = caseSensitive ? node.label : node.label.toLowerCase();
      const matchIndex = labelToMatch.indexOf(kw);

      if (matchIndex >= 0) {
        matches.push({
          data: node.data,
          hasChildren: node.hasChildren,
          index: i,
          label: node.label,
          level: node.level,
          matchRange: { end: matchIndex + kw.length, start: matchIndex },
          parents: node.parents,
          value: node.value,
        });
        // 追加上游祖先，保证匹配节点可被展开
        for (const p of node.parents) {
          matchedParents.add(p);
        }
      }
    }

    // 收集需要展开的键到 refs
    pendingExpandKeys = matchedParents;
    return matches;
  });

  let pendingExpandKeys = new Set<string | number>();

  /** 需要展开的 value 集合 */
  const expandKeys = computed<Set<string | number>>(() => {
    void results.value; // 依赖追踪
    return pendingExpandKeys;
  });

  /** 是否有搜索结果 */
  const hasResults = computed<boolean>(() => {
    return keyword.value.length > 0;
  });

  /**
   * 触发搜索。
   *
   * @param kw - 搜索关键字   */
  function search(kw: string): void {
    keyword.value = kw.trim();
  }

  /** 清空搜索 */
  function clear(): void {
    keyword.value = '';
    pendingExpandKeys = new Set();
  }

  return {
    clear,
    expandKeys,
    hasResults,
    keyword,
    results,
    search,
  };
}
