/**
 * use-tree-drag 单元测试 —— 拖拽排序装配。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\tree-table\use-tree-drag.test.ts
 * @author ydsz-team
 * @since 26.10.17
 */

import { describe, expect, it, vi } from 'vitest';

import { ref } from 'vue';

import { useTreeDrag } from './use-tree-drag';
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
    { id: '1', name: 'row 1' },
    { id: '2', name: 'row 2' },
    { id: '3', name: 'row 3' },
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
  const dragApi = useTreeDrag({ emit, flatRows: flattenApi.flatRows, props });
  return { dragApi, emit, flattenApi, props };
}

describe('useTreeDrag', () => {
  it('初始状态 isDragging 为 false', () => {
    const { dragApi } = makeContext();
    expect(dragApi.isDragging()).toBe(false);
  });

  it('初始状态 fromIndex / toIndex 为 -1', () => {
    const { dragApi } = makeContext();
    expect(dragApi.fromIndex()).toBe(-1);
    expect(dragApi.toIndex()).toBe(-1);
  });

  it('draggable=false 时 onCellPointerDown 不触发拖拽', () => {
    const { dragApi } = makeContext({ draggable: false });
    const event = new PointerEvent('pointerdown');
    // 不应抛出错误
    dragApi.onCellPointerDown(event, 0);
    expect(dragApi.isDragging()).toBe(false);
  });

  it('draggable=true 时 onCellPointerDown 对 root 行可触发', () => {
    const { dragApi } = makeContext({ draggable: true });
    const event = new PointerEvent('pointerdown');
    // 不应抛出错误（dragApi 内部 getItemProps 需要 DOM 环境，此处仅验证不崩溃）
    dragApi.onCellPointerDown(event, 0);
  });
});
