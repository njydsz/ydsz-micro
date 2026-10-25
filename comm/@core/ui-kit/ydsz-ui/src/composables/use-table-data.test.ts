/**
 * useTableData composable 测试 —— 排序/筛选/选择状态机。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-table-data.test.ts
 * @author ydsz-team
 * @since 5.6.0
 */
import { describe, expect, it } from 'vitest';

import { nextTick, ref } from 'vue';

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

  describe('多列排序', () => {
    /** 同 status 行用于验证次级排序列生效 */
    const tieData: TestRow[] = [
      { age: 30, id: 1, name: 'Alice', status: 'active' },
      { age: 25, id: 2, name: 'Bob', status: 'active' },
      { age: 35, id: 3, name: 'Carol', status: 'inactive' },
    ];

    it('additive=true 时应追加到排序链并给出次序', () => {
      const table = useTableData<TestRow>({
        columns,
        data: tieData,
        multipleSort: true,
      });
      table.toggleSort('status');
      table.toggleSort('status', true);
      table.toggleSort('age', true);

      expect(table.sortChain.value).toEqual([
        { order: 'desc', prop: 'status' },
        { order: 'asc', prop: 'age' },
      ]);
      expect(table.getSortRank('status')).toBe(1);
      expect(table.getSortRank('age')).toBe(2);
    });

    it('追加列应作为次级比较：status 相同按 age 升序', () => {
      const table = useTableData<TestRow>({
        columns,
        data: tieData,
        multipleSort: true,
      });
      table.toggleSort('status', true);
      table.toggleSort('age', true);

      expect(table.viewRows.value.map(row => row.name)).toEqual(['Bob', 'Alice', 'Carol']);
    });

    it('非 additive 点击应重置为单列排序', () => {
      const table = useTableData<TestRow>({
        columns,
        data: tieData,
        multipleSort: true,
      });
      table.toggleSort('status', true);
      table.toggleSort('age', true);
      table.toggleSort('name');

      expect(table.sortChain.value).toEqual([{ order: 'asc', prop: 'name' }]);
      expect(table.getSortRank('name')).toBe(1);
    });

    it('multipleSort 关闭时 additive 参数被忽略', () => {
      const table = useTableData<TestRow>({
        columns,
        data: tieData,
      });
      table.toggleSort('status', true);
      table.toggleSort('age', true);

      expect(table.sortChain.value).toEqual([{ order: 'asc', prop: 'age' }]);
      expect(table.getSortRank('age')).toBeNull();
    });

    it('multipleSort 支持响应式 getter 切换', () => {
      const multiple = ref(false);
      const table = useTableData<TestRow>({
        columns,
        data: tieData,
        multipleSort: () => multiple.value,
      });
      table.toggleSort('status', true);
      expect(table.sortChain.value).toHaveLength(1);

      multiple.value = true;
      table.toggleSort('age', true);
      expect(table.sortChain.value).toHaveLength(2);
      expect(table.getSortRank('age')).toBe(2);
    });

    it('setSortChain 应过滤空规则与重复列', () => {
      const table = useTableData<TestRow>({
        columns,
        data: tieData,
        multipleSort: true,
      });
      table.setSortChain([
        { order: 'asc', prop: 'age' },
        { order: 'desc', prop: 'age' },
        { order: 'asc', prop: '' },
        { order: 'name' as never, prop: 'name' },
        { order: 'desc', prop: 'status' },
      ]);

      expect(table.sortChain.value).toEqual([
        { order: 'asc', prop: 'age' },
        { order: 'desc', prop: 'status' },
      ]);
    });

    it('sortState 写入等价于覆盖排序链', () => {
      const table = useTableData<TestRow>({
        columns,
        data: tieData,
        multipleSort: true,
      });
      table.toggleSort('status', true);
      table.sortState.value = { order: 'desc', prop: 'age' };

      expect(table.sortChain.value).toEqual([{ order: 'desc', prop: 'age' }]);
      expect(table.getSortOrder('status')).toBeNull();
      expect(table.getSortOrder('age')).toBe('desc');
    });

    it('clearSort 清空排序链后视图恢复原始顺序', async () => {
      const table = useTableData<TestRow>({
        columns,
        data: tieData,
        multipleSort: true,
      });
      table.toggleSort('age', true);
      await nextTick();
      table.clearSort();
      await nextTick();

      expect(table.sortChain.value).toEqual([]);
      expect(table.sortState.value).toEqual({ order: null, prop: null });
      expect(table.viewRows.value.map(row => row.id)).toEqual([1, 2, 3]);
    });

    it('initialSortChain 应在初始化时生效', () => {
      const table = useTableData<TestRow>({
        columns,
        data: tieData,
        initialSortChain: [{ order: 'desc', prop: 'age' }],
        multipleSort: true,
      });

      expect(table.viewRows.value.map(row => row.age)).toEqual([35, 30, 25]);
    });
  });
});
