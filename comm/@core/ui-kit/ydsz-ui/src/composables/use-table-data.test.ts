/**
 * useTableData composable 测试 —— 排序/筛选/选择状态机。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-table-data.test.ts
 * @author ydsz-team
 * @since 5.6.0
 */
import { describe, expect, it } from 'vitest';

import { nextTick } from 'vue';

import {
  useTableData,
  type TableColumnDef,
} from './use-table-data';

interface TestRow extends Record<string, unknown> {
  id: number;
  name: string;
  age: number;
  status: string;
}

const sampleData: TestRow[] = [
  { age: 30, id: 1, name: 'Alice', status: 'active' },
  { age: 25, id: 2, name: 'Bob', status: 'inactive' },
  { age: 35, id: 3, name: 'Carol', status: 'active' },
];

const columns: TableColumnDef<TestRow>[] = [
  { isSortable: true, key: 'age' },
  { isSortable: true, key: 'name' },
];

describe('useTableData', () => {
  const testData: TestRow[] = [...sampleData];

  it('应返回全部数据（默认状态）', () => {
    const table = useTableData<TestRow>({
      data: testData,
      columns,
    });
    expect(table.viewRows.value).toHaveLength(3);
  });

  it('应按 age 升序排序', async () => {
    const table = useTableData<TestRow>({
      data: testData,
      columns,
    });
    table.toggleSort('age');
    await nextTick();
    expect(table.viewRows.value[0]?.age).toBe(25);
    expect(table.viewRows.value[2]?.age).toBe(35);
  });

  it('排序应循环 asc → desc → null', () => {
    const table = useTableData<TestRow>({
      data: testData,
      columns,
    });
    table.toggleSort('age');
    expect(table.sortState.value.order).toBe('asc');
    table.toggleSort('age');
    expect(table.sortState.value.order).toBe('desc');
    table.toggleSort('age');
    expect(table.sortState.value.order).toBeNull();
  });

  it('应支持行选择', () => {
    const table = useTableData<TestRow>({
      data: testData,
      columns,
      rowSelection: {
        rowKey: (row) => String(row.id),
      },
    });
    table.setSelected(['1', '3']);
    expect(table.selection.value.has('true')).toBe(false);
    expect(table.selection.value.size).toBe(2);
  });

  it('全选应添加所有 key', () => {
    const table = useTableData<TestRow>({
      data: testData,
      columns,
      rowSelection: {
        rowKey: (row) => String(row.id),
      },
    });
    table.toggleSelectAll();
    expect(table.selection.value.size).toBe(3);
  });

  it('筛选应支持 filterMethod', () => {
    const filterCols: TableColumnDef<TestRow>[] = [
      {
        filterMethod: (value, row) => row.status === value,
        isFilterable: true,
        key: 'status',
      },
    ];
    const table = useTableData<TestRow>({
      data: testData,
      columns: filterCols,
    });
    table.setFilter('status', ['active']);
    expect(table.viewRows.value).toHaveLength(2);
    table.clearFilters();
    expect(table.viewRows.value).toHaveLength(3);
  });
});
