/**
 * useTreeHeadless 测试 —— 验证树展开/选择状态、级联、扁平化
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\headless\use-tree-headless.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { describe, expect, it } from 'vitest';

import { nextTick } from 'vue';

import { useTreeHeadless } from './index';

interface TestNode {
  children?: TestNode[];
  name: string;
  value: string;
}

function makeTree(): TestNode[] {
  return [
    {
      children: [
        { name: '子1-1', value: '1-1' },
        { name: '子1-2', value: '1-2' },
      ],
      name: '根1',
      value: '1',
    },
    {
      children: [{ name: '子2-1', value: '2-1' }],
      name: '根2',
      value: '2',
    },
  ];
}

describe('useTreeHeadless', () => {
  it('默认展开与选中集合应为空', () => {
    const handle = useTreeHeadless<TestNode>({ treeData: () => makeTree() });
    expect(handle.expandedKeys.value.size).toBe(0);
    expect(handle.selectedKeys.value.size).toBe(0);
  });

  it('toggleExpand 应展开节点', () => {
    const handle = useTreeHeadless<TestNode>({ treeData: () => makeTree() });
    handle.toggleExpand('1');
    expect(handle.expandedKeys.value.has('1')).toBe(true);
    handle.toggleExpand('1');
    expect(handle.expandedKeys.value.has('1')).toBe(false);
  });

  it('单选 toggleSelect 应替换选中', () => {
    const handle = useTreeHeadless<TestNode>({
      multiple: false,
      treeData: () => makeTree(),
    });
    handle.toggleSelect('1-1');
    expect(handle.selectedKeys.value.has('1-1')).toBe(true);
    handle.toggleSelect('1-2');
    expect(handle.selectedKeys.value.has('1-1')).toBe(false);
    expect(handle.selectedKeys.value.has('1-2')).toBe(true);
  });

  it('多选 toggleSelect 应追加/移除', () => {
    const handle = useTreeHeadless<TestNode>({
      multiple: true,
      treeData: () => makeTree(),
    });
    handle.toggleSelect('1-1');
    handle.toggleSelect('1-2');
    expect(handle.selectedKeys.value.has('1-1')).toBe(true);
    expect(handle.selectedKeys.value.has('1-2')).toBe(true);
    handle.toggleSelect('1-1');
    expect(handle.selectedKeys.value.has('1-1')).toBe(false);
  });

  it('expandAll 应展开所有有子节点的祖先', () => {
    const handle = useTreeHeadless<TestNode>({ treeData: () => makeTree() });
    handle.expandAll();
    expect(handle.expandedKeys.value.has('1')).toBe(true);
    expect(handle.expandedKeys.value.has('2')).toBe(true);
  });

  it('collapseAll 应清空展开集合', () => {
    const handle = useTreeHeadless<TestNode>({ treeData: () => makeTree() });
    handle.expandAll();
    handle.collapseAll();
    expect(handle.expandedKeys.value.size).toBe(0);
  });

  it('clearSelection 应清空选中集合', () => {
    const handle = useTreeHeadless<TestNode>({
      multiple: true,
      treeData: () => makeTree(),
    });
    handle.toggleSelect('1-1');
    handle.clearSelection();
    expect(handle.selectedKeys.value.size).toBe(0);
  });

  it('flattenedNodes 应包含所有节点', async () => {
    const handle = useTreeHeadless<TestNode>({ treeData: () => makeTree() });
    await nextTick();
    expect(handle.flattenedNodes.value.length).toBe(5);
  });
});
