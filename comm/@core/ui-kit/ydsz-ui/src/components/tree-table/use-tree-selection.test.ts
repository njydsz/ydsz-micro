/**
 * use-tree-selection 单元测试 —— 复选框父子级联选择 + 半选态。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\tree-table\use-tree-selection.test.ts
 * @author ydsz-team
 * @since 26.10.17
 */

import { describe, expect, it, vi } from 'vitest';

import { ref } from 'vue';

import { useTreeFlatten } from './use-tree-flatten';
import { useTreeSelection } from './use-tree-selection';

import type { ResolvedTreeTableProps } from './tree-table-shared-types';
import type { TreeFlatRow, YdTreeTableEmits } from './types';

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

function makeContext(overrides: Partial<ResolvedTreeTableProps<Row>> = {}) {
  const props = makeProps(overrides);
  const emit = vi.fn() as unknown as YdTreeTableEmits;
  const internalExpandedKeys = ref<Set<string>>(new Set(props.defaultExpandedKeys));
  const lazyChildrenMap = ref<Record<string, Row[]>>({});
  const flattenApi = useTreeFlatten({ expandedKeys: internalExpandedKeys, lazyChildrenMap, props });
  const selectionApi = useTreeSelection({
    emit,
    flatRows: flattenApi.flatRows,
    getEffectiveChildren: flattenApi.getEffectiveChildren,
    nodeMap: flattenApi.nodeMap,
    props,
  });
  return { emit, flattenApi, selectionApi };
}

function makeFlatRow(key: string, ancestorKeys: string[] = []): TreeFlatRow<Row> {
  const data = makeDataSource();
  const row = key === '1' ? data[0]! : key === '1-1' ? { id: '1-1', name: 'child 1-1' } : { id: '1-2', name: 'child 1-2' };
  return {
    ancestorKeys,
    depth: ancestorKeys.length,
    hasChildren: key === '1',
    key,
    parentKey: ancestorKeys[ancestorKeys.length - 1] ?? null,
    row,
  };
}

describe('useTreeSelection 级联选择', () => {
  it('选中父节点应级联选中所有子孙', () => {
    const { selectionApi } = makeContext();
    selectionApi.toggleCheckbox(makeFlatRow('1'));
    expect(selectionApi.isChecked('1')).toBe(true);
    expect(selectionApi.isChecked('1-1')).toBe(true);
    expect(selectionApi.isChecked('1-2')).toBe(true);
  });

  it('取消父节点应级联取消所有子孙', () => {
    const { selectionApi } = makeContext();
    selectionApi.toggleCheckbox(makeFlatRow('1'));
    selectionApi.toggleCheckbox(makeFlatRow('1'));
    expect(selectionApi.isChecked('1')).toBe(false);
    expect(selectionApi.isChecked('1-1')).toBe(false);
  });

  it('子节点部分选中时父节点进入半选态', () => {
    const { selectionApi } = makeContext();
    selectionApi.toggleCheckbox(makeFlatRow('1-1', ['1']));
    expect(selectionApi.isChecked('1-1')).toBe(true);
    expect(selectionApi.isHalfChecked('1')).toBe(true);
    expect(selectionApi.isChecked('1')).toBe(false);
  });

  it('所有子节点选中时父节点自动选中', () => {
    const { selectionApi } = makeContext();
    selectionApi.toggleCheckbox(makeFlatRow('1-1', ['1']));
    selectionApi.toggleCheckbox(makeFlatRow('1-2', ['1']));
    expect(selectionApi.isChecked('1')).toBe(true);
    expect(selectionApi.isHalfChecked('1')).toBe(false);
  });

  it('checkStrictly=true 时父子互不影响', () => {
    const { selectionApi } = makeContext({ checkStrictly: true });
    selectionApi.toggleCheckbox(makeFlatRow('1'));
    expect(selectionApi.isChecked('1')).toBe(true);
    expect(selectionApi.isChecked('1-1')).toBe(false);
    expect(selectionApi.isHalfChecked('1')).toBe(false);
  });

  it('getCheckedNodes / getHalfCheckedNodes 返回原始节点', () => {
    const { selectionApi } = makeContext();
    selectionApi.toggleCheckbox(makeFlatRow('1'));
    const checked = selectionApi.getCheckedNodes();
    expect(checked.map((n) => n.id).sort()).toEqual(['1', '1-1', '1-2']);
    expect(selectionApi.getHalfCheckedNodes()).toHaveLength(0);
  });

  it('check-change 事件携带正确参数', () => {
    const { emit, selectionApi } = makeContext();
    selectionApi.toggleCheckbox(makeFlatRow('1-1', ['1']));
    expect(emit).toHaveBeenCalledWith('check-change', ['1-1'], ['1']);
  });
});
