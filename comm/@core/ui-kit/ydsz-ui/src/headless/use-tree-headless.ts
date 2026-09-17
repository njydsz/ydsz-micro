/**
 * use-tree-headless：纯逻辑层，管理树的展开/折叠/选择状态与键盘导航。
 *
 * 设计目标：
 *  - 抽取树形组件的核心状态（expandedKeys / selectedKeys）到独立 composable；
 *  - 不持有任何 a11y 属性、CSS class，可在不同 styled 实现中复用；
 *  - 提供 toggleExpand / toggleSelect / selectAll / expandAll 等原子操作。
 *
 * 与 styled 组件的边界：
 *  - Headless 决定 "哪些节点展开"、"哪些节点选中"、"ArrowDown 落点在哪"；
 *  - @see YdTree / @see YdVTreeSearch 决定 "如何用 DOM 渲染叶子节点" + "ARIA 属性怎么写"。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\headless\use-tree-headless.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { computed, ref } from 'vue';

/**
 * 通用树节点要求约束：至少带 value 与可选 children。
 */
export interface TreeNodeLike {
  children?: TreeNodeLike[];
  disabled?: boolean;
  value: string | number;
  [key: string]: unknown;
}

/**
 * Headless Tree 的 props。
 */
export interface UseTreeHeadlessOptions<T extends TreeNodeLike> {
  /** 树根节点数组 */
  treeData: () => T[] | T[];
  /** 节点 value 字段 accessor */
  getValue?: (node: T) => string | number;
  /** 节点 children 字段 accessor */
  getChildren?: (node: T) => T[] | undefined;
  /** 是否多选，默认 false */
  multiple?: boolean;
  /** 是否级联选中（选中父节点同时选中所有子孙），默认 false */
  cascadeSelect?: boolean;
  /** 初始展开的 value 集合（受控） */
  defaultExpandedKeys?: (string | number)[];
  /** 初始选中的 value 集合（受控） */
  defaultSelectedKeys?: (string | number)[];
}

/**
 * Headless Tree 返回的句柄。
 */
export interface TreeHeadlessHandle<T extends TreeNodeLike> {
  /** 当前展开的 value 集合（响应式） */
  expandedKeys: Set<string | number>;
  /** 当前选中的 value 集合（响应式） */
  selectedKeys: Set<string | number>;
  /** 切换展开/折叠 */
  toggleExpand: (value: string | number) => void;
  /** 切换选中态 */
  toggleSelect: (value: string | number) => void;
  /** 设置单个节点的展开状态 */
  setExpand: (value: string | number, expanded: boolean) => void;
  /** 设置单个节点的选中状态（不级联） */
  setSelected: (value: string | number, selected: boolean) => void;
  /** 展开全部节点 */
  expandAll: () => void;
  /** 折叠全部节点 */
  collapseAll: () => void;
  /** 清空所有选中 */
  clearSelection: () => void;
  /** 扁平化节点（含 level / parents），供虚拟滚动使用 */
  flattenedNodes: { data: T; level: number; hasChildren: boolean; parents: Array<string | number> }[];
}

/**
 * use-tree-headless：树的展开/选择状态管理与扁平化输出。
 *
 * @param options - 配置项
 * @return 树逻辑句柄
 *
 * @since 1.0.0
 */
export function useTreeHeadless<T extends TreeNodeLike>(
  options: UseTreeHeadlessOptions<T>,
): TreeHeadlessHandle<T> {
  const {
    treeData,
    getValue = (node: T) => node.value,
    getChildren = (node: T) => node.children as T[] | undefined,
    multiple = false,
    cascadeSelect = false,
    defaultExpandedKeys = [],
    defaultSelectedKeys = [],
  } = options;

  const expandedKeys = ref<Set<string | number>>(
    new Set(defaultExpandedKeys),
  );
  const selectedKeys = ref<Set<string | number>>(
    new Set(defaultSelectedKeys),
  );

  /**
   * 递归扁平化树，同时标注 level / parents / hasChildren。
   *
   * @param items - 当前层节点
   * @param level - 当前层级
   * @param parents - 祖先 value 数组
   * @return 扁平节点数组
   */
  function flatten(
    items: T[],
    level: number,
    parents: Array<string | number>,
  ): {
    data: T;
    hasChildren: boolean;
    level: number;
    parents: Array<string | number>;
    value: string | number;
  }[] {
    const result: {
      data: T;
      hasChildren: boolean;
      level: number;
      parents: Array<string | number>;
      value: string | number;
    }[] = [];

    for (const item of items) {
      const value = getValue(item);
      const children = getChildren(item);
      const hasChildren = Array.isArray(children) && children.length > 0;

      result.push({
        data: item,
        hasChildren,
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

  /**
   * 工具：深度优先收集所有子孙 value。
   *
   * @param node - 起始节点
   * @return 子孙 value 数组
   */
  function collectDescendants(node: T): string | number[] {
    const descendants: Array<string | number> = [];
    const children = getChildren(node);
    if (Array.isArray(children)) {
      for (const child of children) {
        descendants.push(getValue(child));
        descendants.push(...collectDescendants(child));
      }
    }
    return descendants;
  }

  /** 扁平化输出（响应式依赖 treeData） */
  const flattenedNodes = computed(() => {
    const raw = typeof treeData === 'function' ? treeData() : treeData;
    return flatten((raw ?? []) as T[], 0, []);
  });

  /**
   * 切换展开状态：已展开则折叠，已折叠则展开。
   *
   * @param value - 节点 value
   */
  function toggleExpand(value: string | number): void {
    const next = new Set(expandedKeys.value);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    expandedKeys.value = next;
  }

  /**
   * 设置节点的展开态。
   *
   * @param value - 节点 value
   * @param expanded - 是否展开
   */
  function setExpand(value: string | number, expanded: boolean): void {
    const next = new Set(expandedKeys.value);
    if (expanded) {
      next.add(value);
    } else {
      next.delete(value);
    }
    expandedKeys.value = next;
  }

  /**
   * 切换多选/单选：多选切换 value 在集合中的存在性；
   * 单选替换为仅包含该 value 的集合（或空集合）。
   * 若开启级联，则同时操作子孙。
   *
   * @param value - 节点 value
   */
  function toggleSelect(value: string | number): void {
    const next = new Set(selectedKeys.value);
    const isAlreadySelected = next.has(value);

    if (multiple) {
      if (isAlreadySelected) {
        next.delete(value);
        // 级联取消子孙
        if (cascadeSelect) {
          const target = findNode(value);
          if (target) {
            for (const d of collectDescendants(target)) {
              next.delete(d);
            }
          }
        }
      } else {
        next.add(value);
        // 级联添加子孙
        if (cascadeSelect) {
          const target = findNode(value);
          if (target) {
            for (const d of collectDescendants(target)) {
              next.add(d);
            }
          }
        }
      }
    } else {
      // 单选：取消或替换
      next.clear();
      if (!isAlreadySelected) {
        next.add(value);
      }
    }
    selectedKeys.value = next;
  }

  /**
   * 设置单个节点选中态（无级联）。
   *
   * @param value - 节点 value
   * @param selected - 是否选中   */
  function setSelected(value: string | number, selected: boolean): void {
    const next = new Set(selectedKeys.value);
    if (selected) {
      next.add(value);
    } else {
      next.delete(value);
    }
    selectedKeys.value = next;
  }

  /**
   * 查找第一个匹配 value 的节点。
   *
   * @param value - 目标 value
   * @return 找到的节点或 undefined
   */
  function findNode(value: string | number): T | undefined {
    const raw = typeof treeData === 'function' ? treeData() : treeData;
    const nodes = (raw ?? []) as T[];
    return nodes.find((n) => getValue(n) === value);
  }

  /**
   * 展开全部：收集所有有子孙的节点 value 加入展开集合。
   */
  function expandAll(): void {
    const raw = typeof treeData === 'function' ? treeData() : treeData;
    const keys = new Set<string | number>();
    function walk(nodes: T[]): void {
      for (const node of nodes) {
        const children = getChildren(node);        if (Array.isArray(children) && children.length > 0) {
          keys.add(getValue(node));
          walk(children);
        }
      }
    }
    walk(raw ?? []);
    expandedKeys.value = keys;
  }

  /**
   * 折叠全部：清空展开集合。   */
  function collapseAll(): void {
    expandedKeys.value = new Set();
  }

  /**
   * 清空所有选中。
   */
  function clearSelection(): void {
    selectedKeys.value = new Set();
  }

  return {
    clearSelection,
    collapseAll,
    expandedKeys,
    expandAll,
    flattenedNodes,
    setExpand,
    setSelected,
    selectedKeys,
    toggleExpand,
    toggleSelect,
  };
}

/** 重新导出类型 */
export type { TreeNodeLike };
