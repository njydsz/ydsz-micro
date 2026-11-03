/**
 * use-tree-flatten 单元测试 —— 树形扁平化 + 节点映射 + 有效子节点。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\tree-table\use-tree-flatten.test.ts
 * @author ydsz-team
 * @since 26.10.17
 */

import { describe, expect, it } from 'vitest';

import { ref } from 'vue';

import { useTreeFlatten } from './use-tree-flatten';

import type { ResolvedTreeTableProps } from './tree-table-shared-types';

interface Row extends Record<string, unknown> {
  children?: Row[];
  id: string;
  name: string;
}

function makeDataSource(): Row[] {
  return [
    {
      children: [
        { id: '1-1', name: 'child 1-1' },
        { id: '1-2', name: 'child 1-2' },
      ],
      id: '1',
      name: 'parent 1',
    },
    {
      children: [
        { id: '2-1', name: 'child 2-1' },
      ],
      id: '2',
      name: 'parent 2',
    },
    { id: '3', name: 'leaf 3' },
  ];
}

function makeProps(overrides: Partial<ResolvedTreeTableProps<Row>> = {}) {
  return {
    checkStrictly: false,
    checkable: true,
    childrenKey: 'children',
    class: '',
    columns: [{ key: 'name' }],
    dataSource: makeDataSource(),
    defaultCheckedKeys: [] as string[],
    defaultExpandedKeys: [] as string[],
    draggable: false,
    indentSize: 24,
    lazy: false,
    loadingKeys: [] as string[],
    rowKey: 'id',
    showLine: true,
    treeColumnIndex: 0,
    ...overrides,
  } as unknown as ResolvedTreeTableProps<Row>;
}

function makeOptions(overrides: Partial<ResolvedTreeTableProps<Row>> = {}) {
  const props = makeProps(overrides);
  const expandedKeys = ref<Set<string>>(new Set(props.defaultExpandedKeys));
  const lazyChildrenMap = ref<Record<string, Row[]>>({});
  return { expandedKeys, lazyChildrenMap, props };
}

describe('useTreeFlatten', () => {
  it('默认全部收起时 flatRows 仅含 root 节点', () => {
    const { expandedKeys, lazyChildrenMap, props } = makeOptions();
    const api = useTreeFlatten({ expandedKeys, lazyChildrenMap, props });
    expect(api.flatRows.value).toHaveLength(3);
    expect(api.flatRows.value.map((r) => r.key)).toEqual(['1', '2', '3']);
  });

  it('hasChildren 标记正确', () => {
    const { expandedKeys, lazyChildrenMap, props } = makeOptions();
    const api = useTreeFlatten({ expandedKeys, lazyChildrenMap, props });
    const map = new Map(api.flatRows.value.map((r) => [r.key, r]));
    expect(map.get('1')?.hasChildren).toBe(true);
    expect(map.get('2')?.hasChildren).toBe(true);
    expect(map.get('3')?.hasChildren).toBe(false);
  });

  it('展开后子节点进入 flatRows 且携带 depth / ancestorKeys', () => {
    const { expandedKeys, lazyChildrenMap, props } = makeOptions();
    expandedKeys.value = new Set(['1']);
    const api = useTreeFlatten({ expandedKeys, lazyChildrenMap, props });
    const rows = api.flatRows.value;
    expect(rows.map((r) => r.key)).toEqual(['1', '1-1', '1-2', '2', '3']);
    const child = rows[1]!;
    expect(child.depth).toBe(1);
    expect(child.parentKey).toBe('1');
    expect(child.ancestorKeys).toEqual(['1']);
  });

  it('懒加载追加子节点后子节点进入 flatRows', () => {
    const { expandedKeys, lazyChildrenMap, props } = makeOptions();
    lazyChildrenMap.value = { '3': [{ id: 'lazy-1', name: 'lazy child' }] };
    expandedKeys.value = new Set(['3']);
    const api = useTreeFlatten({ expandedKeys, lazyChildrenMap, props });
    const rows = api.flatRows.value;
    expect(rows.map((r) => r.key)).toEqual(['1', '2', '3', 'lazy-1']);
    const lazyRow = rows[3]!;
    expect(lazyRow.depth).toBe(1);
    expect(lazyRow.parentKey).toBe('3');
  });

  it('getEffectiveChildren 合并原始与懒加载子节点', () => {
    const { expandedKeys, lazyChildrenMap, props } = makeOptions();
    lazyChildrenMap.value = { '3': [{ id: 'lazy-1', name: 'lazy child' }] };
    const api = useTreeFlatten({ expandedKeys, lazyChildrenMap, props });
    const node3 = makeDataSource()[2]!;
    const children = api.getEffectiveChildren(node3, '3');
    expect(children).toHaveLength(1);
    expect(children[0]!.id).toBe('lazy-1');
  });

  it('nodeMap 包含所有节点（含嵌套）', () => {
    const { expandedKeys, lazyChildrenMap, props } = makeOptions();
    const api = useTreeFlatten({ expandedKeys, lazyChildrenMap, props });
    expect(api.nodeMap.value.size).toBe(6);
    expect(api.nodeMap.value.has('1')).toBe(true);
    expect(api.nodeMap.value.has('1-1')).toBe(true);
    expect(api.nodeMap.value.has('2-1')).toBe(true);
    expect(api.nodeMap.value.has('3')).toBe(true);
  });

  it('nodeMap 包含懒加载追加的节点', () => {
    const { expandedKeys, lazyChildrenMap, props } = makeOptions();
    lazyChildrenMap.value = { '3': [{ id: 'lazy-1', name: 'lazy child' }] };
    const api = useTreeFlatten({ expandedKeys, lazyChildrenMap, props });
    expect(api.nodeMap.value.has('lazy-1')).toBe(true);
  });
});
