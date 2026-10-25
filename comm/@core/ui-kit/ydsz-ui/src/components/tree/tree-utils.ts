/**
 * YdTree 工具函数：键提取、搜索匹配、展开状态持久化。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\tree\tree-utils.ts
 * @author ydsz-team
 * @since 26.10.11
 */

import type { TreeNodeData } from './tree-types';

/** 从 localStorage 读取展开的键集合 */
export function readExpandedKeysFromStorage(storageKey: string): (string | number)[] | null {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as (string | number)[];
    }
    return null;
  } catch {
    return null;
  }
}

/** 把展开键集合写入 localStorage */
export function writeExpandedKeysToStorage(storageKey: string, keys: (string | number)[]): void {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(keys));
  } catch {
    // 忽略配额超限等存储错误
  }
}

/** 生成节点的内置唯一键（基于 title + 随机后缀作为兜底） */
export function fallbackKey(node: TreeNodeData, index: number): string {
  if (node.key !== undefined && node.key !== null) {
    return String(node.key);
  }
  if (node.title) {
    return `${node.title}-${index}`;
  }
  return `__yd_tree_node_${index}`;
}

/** 默认过滤器：通过 title 包含匹配（不区分大小写） */
export function defaultFilterMethod(node: TreeNodeData, keyword: string): boolean {
  if (!keyword) {
    return true;
  }
  const haystack = String(node.title ?? '').toLowerCase();
  const needle = keyword.toLowerCase();
  return haystack.includes(needle);
}

/**
 * 计算经过搜索过滤后应当展开的键集合。
 *
 * 只要某节点的 title 命中关键字，或其子树中存在命中节点，
 * 该节点就需要展开以露出命中的子节点。
 *
 * @returns 需要展开的节点 key 集合（Set 形式）
 */
export function computeExpandKeysOnSearch(
  data: TreeNodeData[],
  keyword: string,
  getKey: (node: TreeNodeData) => string | number,
  filterMethod: (node: TreeNodeData, keyword: string) => boolean,
  getChildren: (node: TreeNodeData) => TreeNodeData[] | undefined,
) {
  const expandKeys = new Set<string | number>();

  // 空关键字无需展开
  if (!keyword) {
    return expandKeys;
  }

  function traverse(nodes: TreeNodeData[]): boolean {
    let anyDescendantMatched = false;
    for (const node of nodes) {
      const selfMatched = filterMethod(node, keyword);
      const children = getChildren(node);
      let childMatched = false;
      if (children && children.length > 0) {
        childMatched = traverse(children);
      }
      if (selfMatched || childMatched) {
        expandKeys.add(getKey(node));
        anyDescendantMatched = true;
      }
    }
    return anyDescendantMatched;
  }

  traverse(data);
  return expandKeys;
}

/**
 * 递归收集树中所有节点的 key。
 *
 * @remarks
 * 树形选择等场景需要一次性拿到全部 key（用于全选/半选判断），
 * 因此把子节点与 key 的取值方式交给调用方，避免依赖具体的节点字段名。
 *
 * @param nodes - 起始节点列表
 * @param getChildren - 取子节点列表的函数
 * @param getKey - 取节点 key 的函数
 * @returns 按先序遍历排列的 key 数组
 */
export function collectAllKeys<T>(
  nodes: T[],
  getChildren: (node: T) => T[] | undefined,
  getKey: (node: T) => string | number,
): (string | number)[] {
  const keys: (string | number)[] = [];
  const walk = (list: T[] | undefined) => {
    if (!list) {
      return;
    }
    for (const node of list) {
      keys.push(getKey(node));
      walk(getChildren(node));
    }
  };
  walk(nodes);
  return keys;
}
