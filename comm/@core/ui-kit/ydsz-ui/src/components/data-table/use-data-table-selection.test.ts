/**
 * useDataTableSelection composable 测试。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\data-table\use-data-table-selection.test.ts
 * @author ydsz-team
 * @since 5.6.0
 */

import { describe, expect, it } from 'vitest';

import { ref } from 'vue';

import { useDataTableSelection } from './use-data-table-selection';

import type { DataTableColumnDef } from './types';

interface TestRow extends Record<string, unknown> {
  id: string;
  name: string;
}

const columns: DataTableColumnDef<TestRow>[] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'fixedCol', fixed: 'left', label: 'Fixed' },
];

function setup(rows: TestRow[], initialSelection = new Set<string>()) {
  const dataRows = ref(rows);
  const selection = ref(initialSelection);
  const columnsRef = ref<DataTableColumnDef<TestRow>[]>(columns);

  const api = useDataTableSelection<TestRow>(dataRows, {
    columns: columnsRef,
    rowKey: (row: TestRow) => row.id,
    selection,
    setSelected: (set) => (selection.value = set),
    summary: (rs) => ({ id: String(rs.length) }),
    toggleSelectAll: () => {
      const all = new Set(rows.map((r) => r.id));
      selection.value = selection.value.size === all.size ? new Set() : all;
    },
  });

  return { api, dataRows, selection };
}

describe('useDataTableSelection', () => {
  it('计算视图行 key 列表', () => {
    const { api } = setup([
      { id: '1', name: 'a' },
      { id: '2', name: 'b' },
    ]);

    expect(api.rowKeys.value).toEqual(['1', '2']);
  });

  it('无数据时 rowKeys 为空', () => {
    const { api } = setup([]);

    expect(api.rowKeys.value).toEqual([]);
  });

  it('全部选中时 isAllSelected 为 true', () => {
    const { api } = setup(
      [
        { id: '1', name: 'a' },
        { id: '2', name: 'b' },
      ],
      new Set(['1', '2']),
    );

    expect(api.isAllSelected.value).toBe(true);
    expect(api.someSelected.value).toBe(false);
  });

  it('部分选中时 someSelected 为 true', () => {
    const { api } = setup(
      [
        { id: '1', name: 'a' },
        { id: '2', name: 'b' },
      ],
      new Set(['1']),
    );

    expect(api.isAllSelected.value).toBe(false);
    expect(api.someSelected.value).toBe(true);
  });

  it('无选中时 both false', () => {
    const { api } = setup([{ id: '1', name: 'a' }]);

    expect(api.isAllSelected.value).toBe(false);
    expect(api.someSelected.value).toBe(false);
  });

  it('空数据时 isAllSelected 为 false', () => {
    const { api } = setup([], new Set());

    expect(api.isAllSelected.value).toBe(false);
  });

  it('handleSelect 切换单行选中态', () => {
    const { api, selection } = setup([{ id: '1', name: 'a' }]);

    api.handleSelect('1');
    expect(selection.value.has('1')).toBe(true);

    api.handleSelect('1');
    expect(selection.value.has('1')).toBe(false);
  });

  it('handleSelect 不影响其他行', () => {
    const { api, selection } = setup(
      [
        { id: '1', name: 'a' },
        { id: '2', name: 'b' },
      ],
      new Set(['1']),
    );

    api.handleSelect('2');
    expect(selection.value.has('1')).toBe(true);
    expect(selection.value.has('2')).toBe(true);
  });

  it('handleSelectAll 委托 toggleSelectAll', () => {
    const { api, selection } = setup([
      { id: '1', name: 'a' },
      { id: '2', name: 'b' },
    ]);

    api.handleSelectAll();
    expect(selection.value.size).toBe(2);

    api.handleSelectAll();
    expect(selection.value.size).toBe(0);
  });

  it('summaryValues 在有数据时计算', () => {
    const { api } = setup([
      { id: '1', name: 'a' },
      { id: '2', name: 'b' },
    ]);

    expect(api.summaryValues.value).toEqual({ id: '2' });
  });

  it('summaryValues 在无数据时为空', () => {
    const { api } = setup([]);

    expect(api.summaryValues.value).toEqual({});
  });

  it('columnChooserColumns 标记固定列不可隐藏', () => {
    const { api } = setup([]);

    const fixedCol = api.columnChooserColumns.value.find(
      (c: { key: string }) => c.key === 'fixedCol',
    );
    const normalCol = api.columnChooserColumns.value.find((c: { key: string }) => c.key === 'id');

    expect(fixedCol?.hideable).toBe(false);
    expect(normalCol?.hideable).toBe(true);
  });

  it('columnChooserColumns 使用 label 兜底 key', () => {
    const { api } = setup([]);

    const col = api.columnChooserColumns.value.find((c: { key: string }) => c.key === 'id');
    expect(col?.label).toBe('ID');
  });

  it('columnChooserOpen 初始为 false', () => {
    const { api } = setup([]);

    expect(api.columnChooserOpen.value).toBe(false);
  });

  it('handleColumnVisibilityChange 返回可见性映射', () => {
    const { api } = setup([]);

    const vis = api.handleColumnVisibilityChange(['id']);

    expect(vis).toEqual({ fixedCol: false, id: true, name: false });
  });

  it('handleColumnVisibilityReset 返回空映射', () => {
    const { api } = setup([]);

    expect(api.handleColumnVisibilityReset()).toEqual({});
  });

  it('数据变化时 rowKeys 响应式更新', () => {
    const { api, dataRows } = setup([{ id: '1', name: 'a' }]);

    expect(api.rowKeys.value).toEqual(['1']);

    dataRows.value = [
      { id: '1', name: 'a' },
      { id: '2', name: 'b' },
    ];
    expect(api.rowKeys.value).toEqual(['1', '2']);
  });
});
