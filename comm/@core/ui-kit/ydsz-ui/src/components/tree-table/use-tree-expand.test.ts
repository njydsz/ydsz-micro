/**
 * use-tree-expand 单元测试 —— 展开 / 收起状态 + 懒加载协调。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\tree-table\use-tree-expand.test.ts
 * @author ydsz-team
 * @since 26.10.17
 */

import { describe, expect, it, vi } from 'vitest';

import { ref } from 'vue';

import { useTreeExpand } from './use-tree-expand';
import { useTreeFlatten } from './use-tree-flatten';

import type { ResolvedTreeTableProps } from './tree-table-shared-types';
import type { YdTreeTableEmits } from './types';

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
      children: [{ id: '2-1', name: 'child 2-1' }],
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

function makeContext(overrides: Partial<ResolvedTreeTableProps<Row>> = {}) {
  const props = makeProps(overrides);
  const emit = vi.fn() as unknown as YdTreeTableEmits;
  const internalExpandedKeys = ref<Set<string>>(new Set(props.defaultExpandedKeys));
  const lazyChildrenMap = ref<Record<string, Row[]>>({});
  const flattenApi = useTreeFlatten({ expandedKeys: internalExpandedKeys, lazyChildrenMap, props });
  const expandApi = useTreeExpand({
    emit,
    getEffectiveChildren: flattenApi.getEffectiveChildren,
    internalExpandedKeys,
    lazyChildrenMap,
    nodeMap: flattenApi.nodeMap,
    props,
  });
  return { emit, expandApi, flattenApi, internalExpandedKeys, lazyChildrenMap, props };
}

describe('useTreeExpand 展开 / 收起', () => {
  it('expandKey 触发 update:expandedKeys 与 expand 事件', () => {
    const { emit, expandApi } = makeContext();
    expandApi.expandKey('1');
    expect(emit).toHaveBeenCalledWith('update:expandedKeys', ['1']);
    expect(emit).toHaveBeenCalledWith('expand', '1', expect.objectContaining({ id: '1' }));
  });

  it('collapseKey 触发 update:expandedKeys 与 collapse 事件', () => {
    const { emit, expandApi } = makeContext();
    expandApi.expandKey('1');
    expandApi.collapseKey('1');
    expect(emit).toHaveBeenCalledWith('update:expandedKeys', []);
    expect(emit).toHaveBeenCalledWith('collapse', '1', expect.objectContaining({ id: '1' }));
  });

  it('toggleExpand 在展开与收起间切换', () => {
    const { expandApi, internalExpandedKeys } = makeContext();
    expandApi.toggleExpand('1');
    expect(internalExpandedKeys.value.has('1')).toBe(true);
    expandApi.toggleExpand('1');
    expect(internalExpandedKeys.value.has('1')).toBe(false);
  });

  it('expandAll 展开所有有子节点的 key', () => {
    const { expandApi, internalExpandedKeys } = makeContext();
    expandApi.expandAll();
    expect(Array.from(internalExpandedKeys.value).sort()).toEqual(['1', '2']);
  });

  it('collapseAll 清空展开态', () => {
    const { expandApi, internalExpandedKeys } = makeContext();
    expandApi.expandAll();
    expandApi.collapseAll();
    expect(internalExpandedKeys.value.size).toBe(0);
  });

  it('expandNode / collapseNode 是 expandKey / collapseKey 别名', () => {
    const { expandApi, internalExpandedKeys } = makeContext();
    expandApi.expandNode('1');
    expect(internalExpandedKeys.value.has('1')).toBe(true);
    expandApi.collapseNode('1');
    expect(internalExpandedKeys.value.has('1')).toBe(false);
  });
});

describe('useTreeExpand 懒加载', () => {
  it('已有子节点时直接展开不调用 loadData', () => {
    const loadData = vi.fn(async () => [{ id: 'x', name: 'x' }]);
    const { expandApi } = makeContext({ lazy: true, loadData });
    expandApi.handleToggleExpand({
      ancestorKeys: [],
      depth: 0,
      hasChildren: true,
      key: '1',
      parentKey: null,
      row: makeDataSource()[0]!,
    });
    expect(loadData).not.toHaveBeenCalled();
  });

  it('lazy=false 时不触发加载', async () => {
    const loadData = vi.fn(async () => [{ id: 'x', name: 'x' }]);
    const { expandApi } = makeContext({ loadData });
    await expandApi.handleLazyLoad('3');
    expect(loadData).not.toHaveBeenCalled();
  });

  it('loadData 返回空数组时不写入 lazyChildrenMap', async () => {
    const loadData = vi.fn(async () => [] as Row[]);
    const { expandApi, flattenApi } = makeContext({ lazy: true, loadData });
    await expandApi.handleLazyLoad('3');
    expect(loadData).toHaveBeenCalledTimes(1);
    expect(flattenApi.flatRows.value.map((r) => r.key)).toEqual(['1', '2', '3']);
  });

  it('加载完成后触发 load-success 并展开', async () => {
    const loadData = vi.fn(async () => [{ id: 'lazy-1', name: 'lazy child' }]);
    const { emit, expandApi, internalExpandedKeys } = makeContext({ lazy: true, loadData });
    await expandApi.handleLazyLoad('3');
    expect(emit).toHaveBeenCalledWith('load-success', '3', [{ id: 'lazy-1', name: 'lazy child' }]);
    expect(internalExpandedKeys.value.has('3')).toBe(true);
  });

  it('isNodeLoading 返回正确的加载态', () => {
    const { expandApi } = makeContext({ loadingKeys: ['1'] });
    expect(expandApi.isNodeLoading('1')).toBe(true);
    expect(expandApi.isNodeLoading('2')).toBe(false);
  });
});
