/**
 * use-tree-check-strategy —— 树形多选的父子级联与 tri-state 计算。
 *
 * 对标 Ant Design TreeSelect 的 `treeCheckStrategy`：
 *  - 'all'（默认）：父子完全关联，选父即全选子孙，选全部子孙父自动全选；
 *  - 'parent'：只提交父节点值（子孙仅用于驱动父半选/全选）；
 *  - 'children'：只提交叶子节点值（父节点仅作分组，不参与提交）。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\tree-select\use-tree-check-strategy.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { computed } from 'vue';

import type { TreeFlatNode, TreeNodeLike } from '../../headless/use-tree-headless';

/** 勾选策略 */
export type TreeCheckStrategy = 'all' | 'children' | 'parent';

/** 节点勾选态 */
export type CheckState = 'checked' | 'unchecked' | 'indeterminate';

/**
 * 收集某节点下所有「可提交」的后代值。
 *
 * @param node - 起始节点（含 children 数据）
 * @param strategy - 勾选策略
 * @returns 值集合
 */
function collectDescendantValues(
  node: TreeFlatNode<any>,
  strategy: TreeCheckStrategy,
): Array<string | number> {
  const values: Array<string | number> = [];
  const children = (node.data.children ?? []) as Array<Record<string, any>>;

  children.forEach((child) => {
    const grandChildren = (child.children ?? []) as Array<Record<string, any>>;
    const hasGrand = grandChildren.length > 0;

    if (strategy === 'parent') {
      // parent 策略：只收集直接子节点（不再深入）
      values.push(child.value);
    } else if (strategy === 'children') {
      // children 策略：只收集叶子
      if (hasGrand) {
        values.push(
          ...collectDescendantValues({ data: child, level: 0 } as TreeFlatNode<any>, strategy),
        );
      } else {
        values.push(child.value);
      }
    } else {
      // all 策略：收集全部后代
      values.push(child.value);
      if (hasGrand) {
        values.push(
          ...collectDescendantValues({ data: child, level: 0 } as TreeFlatNode<any>, strategy),
        );
      }
    }
  });

  return values;
}

/**
 * useTreeCheckStrategy —— 树形多选父子级联与 tri-state 计算。
 *
 * @param options - 配置
 * @returns 级联操作 API
 */
export function useTreeCheckStrategy<T extends TreeNodeLike>(options: {
  /** 勾选策略 */
  strategy?: () => TreeCheckStrategy;
  /** 当前已选值集合 */
  checkedValues: () => Set<string | number>;
  /** 扁平节点集合（含 children 数据） */
  nodes: () => Array<TreeFlatNode<T>>;
}) {
  const strategy = computed(() => options.strategy?.() ?? 'all');

  /**
   * 计算某节点的勾选态。
   */
  function getCheckState(node: TreeFlatNode<T>): CheckState {
    const value = node.value;
    const checked = options.checkedValues().has(value);

    const children = (node.data.children ?? []) as Array<Record<string, any>>;
    if (children.length === 0) return checked ? 'checked' : 'unchecked';

    const descendantValues = collectDescendantValues(node, strategy.value);
    const checkedDescendants = descendantValues.filter((v) => options.checkedValues().has(v));

    if (checkedDescendants.length === 0) return checked ? 'checked' : 'unchecked';
    if (checkedDescendants.length === descendantValues.length) return 'checked';
    return 'indeterminate';
  }

  /**
   * 切换某节点的勾选态，返回新的选中值集合。
   *
   * @param node - 目标节点
   * @returns 新的选中值集合
   */
  function toggle(node: TreeFlatNode<T>): Set<string | number> {
    const next = new Set(options.checkedValues());
    const wasChecked = next.has(node.value);

    if (wasChecked) {
      // 取消：移除自身 + 全部后代
      next.delete(node.value);
      collectDescendantValues(node, strategy.value).forEach((v) => next.delete(v));
    } else {
      // 选中：加入自身 + 全部后代
      next.add(node.value);
      collectDescendantValues(node, strategy.value).forEach((v) => next.add(v));
    }

    // 级联更新祖先
    cascadeAncestors(node, next);
    return next;
  }

  /**
   * 根据子孙状态回写祖先的勾选态。
   */
  function cascadeAncestors(node: TreeFlatNode<T>, next: Set<string | number>): void {
    const parents = node.parents ?? [];
    // 从最近的祖先向上更新
    for (let i = parents.length - 1; i >= 0; i--) {
      const parentValue = parents[i]!;
      const parentNode = options.nodes().find((n) => n.value === parentValue);
      if (!parentNode) continue;

      const descendantValues = collectDescendantValues(parentNode, strategy.value);
      const checkedCount = descendantValues.filter((v) => next.has(v)).length;

      if (checkedCount === 0) {
        next.delete(parentValue);
      } else if (checkedCount === descendantValues.length) {
        next.add(parentValue);
      } else {
        // 半选态：父节点不加入提交集合
        next.delete(parentValue);
      }
    }
  }

  /**
   * 按策略过滤提交值（parent/children 策略下剔除中间节点）。
   */
  function toCommitValues(raw: Set<string | number>): Array<string | number> {
    if (strategy.value === 'all') return [...raw];

    const allNodes = options.nodes();
    const valueToNode = new Map<string | number, TreeFlatNode<T>>();
    allNodes.forEach((n) => valueToNode.set(n.value, n));

    return [...raw].filter((value) => {
      const node = valueToNode.get(value);
      if (!node) return true;
      const hasChildren = ((node.data.children ?? []) as unknown[]).length > 0;
      if (strategy.value === 'parent') return hasChildren || !hasChildren;
      // children 策略：只保留叶子
      return !hasChildren;
    });
  }

  return {
    getCheckState,
    toggle,
    toCommitValues,
    strategy,
  };
}
