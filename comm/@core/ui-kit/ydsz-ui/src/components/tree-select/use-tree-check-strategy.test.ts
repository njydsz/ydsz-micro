/**
 * useTreeCheckStrategy 父子级联与 tri-state 测试。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\tree-select\use-tree-check-strategy.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { describe, expect, it } from 'vitest';

import { useTreeCheckStrategy, type TreeCheckStrategy } from './use-tree-check-strategy';

/** 构造测试树 */
const treeData = [
  {
    label: 'Parent A',
    value: 'a',
    children: [
      { label: 'Child A1', value: 'a1', children: [] },
      { label: 'Child A2', value: 'a2', children: [] },
    ],
  },
  {
    label: 'Parent B',
    value: 'b',
    children: [{ label: 'Child B1', value: 'b1', children: [] }],
  },
];

/** 构造扁平节点（简化版） */
function buildNodes() {
  return [
    {
      data: treeData[0],
      level: 0,
      parents: [] as Array<string | number>,
      value: 'a',
      hasChildren: true,
    },
    { data: treeData[0]!.children[0], level: 1, parents: ['a'], value: 'a1', hasChildren: false },
    { data: treeData[0]!.children[1], level: 1, parents: ['a'], value: 'a2', hasChildren: false },
    {
      data: treeData[1],
      level: 0,
      parents: [] as Array<string | number>,
      value: 'b',
      hasChildren: true,
    },
    { data: treeData[1]!.children[0], level: 1, parents: ['b'], value: 'b1', hasChildren: false },
  ] as any[];
}

describe('useTreeCheckStrategy', () => {
  describe('all 策略（默认）', () => {
    it('选中父节点级联选中全部子孙', () => {
      let checked = new Set<string | number>();
      const ctrl = useTreeCheckStrategy({
        strategy: () => 'all' as TreeCheckStrategy,
        checkedValues: () => checked,
        nodes: buildNodes,
      });
      const parentA = buildNodes()[0]!;
      checked = ctrl.toggle(parentA);
      expect(checked.has('a')).toBe(true);
      expect(checked.has('a1')).toBe(true);
      expect(checked.has('a2')).toBe(true);
    });

    it('选中全部子节点后父节点自动全选', () => {
      let checked = new Set<string | number>(['a1']);
      const ctrl = useTreeCheckStrategy({
        strategy: () => 'all' as TreeCheckStrategy,
        checkedValues: () => checked,
        nodes: buildNodes,
      });
      const childA2 = buildNodes()[2]!;
      checked = ctrl.toggle(childA2);
      // 两个子节点都选中，父节点应为 checked
      expect(ctrl.getCheckState(buildNodes()[0]!)).toBe('checked');
    });

    it('选中部分子节点后父节点为 indeterminate', () => {
      let checked = new Set<string | number>(['a1']);
      const ctrl = useTreeCheckStrategy({
        strategy: () => 'all' as TreeCheckStrategy,
        checkedValues: () => checked,
        nodes: buildNodes,
      });
      expect(ctrl.getCheckState(buildNodes()[0]!)).toBe('indeterminate');
    });

    it('取消父节点级联取消全部子孙', () => {
      let checked = new Set<string | number>(['a', 'a1', 'a2']);
      const ctrl = useTreeCheckStrategy({
        strategy: () => 'all' as TreeCheckStrategy,
        checkedValues: () => checked,
        nodes: buildNodes,
      });
      checked = ctrl.toggle(buildNodes()[0]!);
      expect(checked.has('a')).toBe(false);
      expect(checked.has('a1')).toBe(false);
      expect(checked.has('a2')).toBe(false);
    });
  });

  describe('children 策略', () => {
    it('提交值只保留叶子节点', () => {
      let checked = new Set<string | number>(['a', 'a1', 'a2']);
      const ctrl = useTreeCheckStrategy({
        strategy: () => 'children' as TreeCheckStrategy,
        checkedValues: () => checked,
        nodes: buildNodes,
      });
      const commit = ctrl.toCommitValues(checked);
      expect(commit).toContain('a1');
      expect(commit).toContain('a2');
      expect(commit).not.toContain('a');
    });
  });

  describe('parent 策略', () => {
    it('选中父节点只提交父节点值', () => {
      let checked = new Set<string | number>();
      const ctrl = useTreeCheckStrategy({
        strategy: () => 'parent' as TreeCheckStrategy,
        checkedValues: () => checked,
        nodes: buildNodes,
      });
      checked = ctrl.toggle(buildNodes()[0]!);
      const commit = ctrl.toCommitValues(checked);
      expect(commit).toContain('a');
    });
  });

  describe('getCheckState', () => {
    it('无子节点时返回 unchecked/checked', () => {
      let checked = new Set<string | number>();
      const ctrl = useTreeCheckStrategy({
        strategy: () => 'all' as TreeCheckStrategy,
        checkedValues: () => checked,
        nodes: buildNodes,
      });
      const leaf = buildNodes()[1]!;
      expect(ctrl.getCheckState(leaf)).toBe('unchecked');
      checked = new Set(['a1']);
      expect(ctrl.getCheckState(leaf)).toBe('checked');
    });

    it('父节点无子选中时为 unchecked', () => {
      let checked = new Set<string | number>();
      const ctrl = useTreeCheckStrategy({
        strategy: () => 'all' as TreeCheckStrategy,
        checkedValues: () => checked,
        nodes: buildNodes,
      });
      expect(ctrl.getCheckState(buildNodes()[0]!)).toBe('unchecked');
    });
  });
});
