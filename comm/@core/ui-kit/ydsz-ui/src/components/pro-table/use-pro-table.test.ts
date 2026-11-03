/**
 * useProTable 单元测试 —— 搜索表单 / 分页 / 行内编辑 / 新增弹窗 / 行选择装配。
 *
 * <p>覆盖从 YdProTable.vue 提取的核心逻辑：
 * <ul>
 *   <li>行选择 + useTableData 装配：viewRows / selection / sortState</li>
 *   <li>排序回传：handleSortStateChange 写回 tableData.sortState</li>
 *   <li>分页事件：pageChange + change 参数</li>
 *   <li>搜索表单：handleSearch / handleResetSearch / showAutoSearch</li>
 *   <li>行内编辑：startEdit / saveEdit / cancelEdit / 文案回退</li>
 *   <li>新增弹窗：handleOpenCreate / handleCreateSubmit / 表单值重置</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\pro-table\use-pro-table.test.ts
 * @author ydsz-team
 * @since 5.7.0
 */
import { describe, expect, it, vi } from 'vitest';

import { nextTick, reactive, ref } from 'vue';

import { useProTable } from './use-pro-table';

import type { ProTableEmits } from './use-pro-table';

import type {
  EditableConfig,
  ProTableProps,
} from './pro-table-types';
import type { TableExportApi } from '../data-table';
import type { TableColumnDef } from '../../composables/use-table-data';

interface Person extends Record<string, unknown> {
  age: number;
  name: string;
}

const columns: TableColumnDef<Person>[] = [
  { isSortable: true, key: 'name' },
  { isSortable: true, key: 'age', sorter: (a, b) => a.age - b.age },
];

const people: Person[] = [
  { age: 30, name: 'Alice' },
  { age: 25, name: 'Bob' },
  { age: 40, name: 'Carol' },
];

/** makeOptions 返回值 */
interface MakeOptionsResult {
  emit: ProTableEmits;
  props: ProTableProps<Person> & { rowKey: (row: Person, index: number) => string };
  setDataSource: (next: Person[]) => void;
}

/**
 * 构造 composable 入参。
 *
 * <p>组件里 `defineProps` 返回的是 reactive 对象，测试用 `reactive` 复刻；
 * `dataSource` / `columns` 用 getter 暴露给用例读写，保持响应式。
 */
function makeOptions(
  propsOverrides: Partial<ProTableProps<Person>> = {},
  emit?: ProTableEmits,
): MakeOptionsResult {
  const dataSource = ref(people);
  const props = reactive({
    rowKey: (_row: Person, idx: number) => String(idx),
    ...propsOverrides,
    get columns() {
      return columns;
    },
    get dataSource() {
      return dataSource.value;
    },
  }) as unknown as ProTableProps<Person> & { rowKey: (row: Person, index: number) => string };
  return {
    emit: emit ?? vi.fn(),
    props,
    setDataSource: (next: Person[]) => { dataSource.value = next; },
  };
}

/** 收集 emit 调用 */
function makeCollectEmit() {
  const calls: Array<[string, ...unknown[]]> = [];
  const fn = vi.fn((e: string, ...args: unknown[]) => {
    calls.push([e, ...args]);
  });
  return { calls, fn };
}

describe('useProTable 行选择与 useTableData 装配', () => {
  it('无 rowSelection 时 selection 为空集合，viewRows 透传 dataSource', () => {
    const options = makeOptions();
    const core = useProTable<Person>(options);

    expect(core.tableData.selection.value.size).toBe(0);
    expect(core.tableData.viewRows.value).toEqual(people);
  });

  it('传入 rowSelection.selectedKeys 时应作为受控 selection', () => {
    const options = makeOptions({
      rowSelection: { selectedKeys: ['0', '2'], type: 'checkbox' },
    });
    const core = useProTable<Person>(options);

    expect(core.tableData.selection.value).toEqual(new Set(['0', '2']));
  });

  it('handleSortStateChange 应写回 sortState', () => {
    const options = makeOptions();
    const core = useProTable<Person>(options);

    core.handleSortStateChange({ order: 'asc', prop: 'age' });

    expect(core.sortState.value).toEqual({ order: 'asc', prop: 'age' });
  });
});

describe('useProTable 分页事件', () => {
  it('handlePageChange 应触发 pageChange 与 change', () => {
    const { calls, fn } = makeCollectEmit();
    const options = makeOptions({
      pagination: { current: 2, pageSize: 10, total: 100 },
    }, fn);
    const core = useProTable<Person>(options);

    core.handlePageChange(3, 20);

    const pageChange = calls.find(([e]) => e === 'pageChange');
    const change = calls.find(([e]) => e === 'change');

    expect(pageChange).toEqual(['pageChange', 3, 20]);
    expect(change?.[1]).toEqual({ current: 3, pageSize: 20, total: 100 });
    expect(change?.[2]).toEqual({});
    expect(change?.[3]).toEqual({ order: null, prop: '' });
  });

  it('无 pagination 时 change 的首参应使用默认分页', () => {
    const { calls, fn } = makeCollectEmit();
    const options = makeOptions({}, fn);
    const core = useProTable<Person>(options);

    core.handlePageChange(1, 10);

    const change = calls.find(([e]) => e === 'change');
    expect(change?.[1]).toEqual({ current: 1, pageSize: 10, total: 0 });
  });
});

describe('useProTable 搜索表单', () => {
  it('showAutoSearch 应随 searchFields 是否存在而变化', () => {
    const without = useProTable<Person>(makeOptions());
    expect(without.showAutoSearch.value).toBe(false);

    const withFields = useProTable<Person>(makeOptions({
      searchFields: [{ key: 'name', label: '姓名' }],
    }));
    expect(withFields.showAutoSearch.value).toBe(true);
  });

  it('searchValues 应按 searchFields 初始化', () => {
    const core = useProTable<Person>(makeOptions({
      searchFields: [{ key: 'name', label: '姓名' }, { key: 'age', label: '年龄' }],
    }));

    expect(core.searchValues).toEqual({ age: undefined, name: undefined });
  });

  it('handleSearch 应触发 change 与 onSearch，并把搜索值快照传出', () => {
    const onSearch = vi.fn();
    const { calls, fn } = makeCollectEmit();
    const core = useProTable<Person>(makeOptions({
      onSearch,
      searchFields: [{ key: 'name', label: '姓名' }],
    }, fn));

    core.searchValues.name = 'Alice';
    core.handleSearch();

    const change = calls.find(([e]) => e === 'change');
    expect(change?.[2]).toEqual({ name: 'Alice' });
    expect(onSearch).toHaveBeenCalledWith({ name: 'Alice' });
  });

  it('handleResetSearch 应清空所有字段后触发搜索', () => {
    const onSearch = vi.fn();
    const { calls, fn } = makeCollectEmit();
    const core = useProTable<Person>(makeOptions({
      onSearch,
      searchFields: [{ key: 'name', label: '姓名' }],
    }, fn));

    core.searchValues.name = 'Alice';
    core.handleResetSearch();

    expect(core.searchValues.name).toBeUndefined();
    const lastChange = calls.filter(([e]) => e === 'change').at(-1);
    expect(lastChange?.[2]).toEqual({ name: undefined });
    expect(onSearch).toHaveBeenCalledTimes(1);
  });
});

describe('useProTable 行内编辑', () => {
  it('isEditable 应随 editable 是否存在而变化', () => {
    const off = useProTable<Person>(makeOptions());
    expect(off.isEditable.value).toBe(false);

    const on = useProTable<Person>(makeOptions({ editable: true }));
    expect(on.isEditable.value).toBe(true);
  });

  it('editableConfig 为对象时透传，为 true 时降级为空对象', () => {
    const config: EditableConfig = { onEdit: vi.fn() };
    const objectCase = useProTable<Person>(makeOptions({ editable: config }));
    expect(objectCase.editableConfig.value).toStrictEqual(config);

    const booleanCase = useProTable<Person>(makeOptions({ editable: true }));
    expect(booleanCase.editableConfig.value).toStrictEqual({});
  });

  it('startEdit 应写入编辑行数据并触发 onEdit', () => {
    const onEdit = vi.fn();
    const core = useProTable<Person>(makeOptions({
      editable: { onEdit },
    }));

    core.startEdit(people[1]!, 1);

    expect(core.editingRowIdx.value).toBe(1);
    expect(core.editRowData).toEqual({ age: 25, name: 'Bob' });
    expect(onEdit).toHaveBeenCalledWith(people[1], 1);
  });

  it('saveEdit onSave 返回 true 时应退出编辑态', async () => {
    const onSave = vi.fn(async () => true);
    const core = useProTable<Person>(makeOptions({ editable: { onSave } }));

    core.startEdit(people[0]!, 0);
    await core.saveEdit(0);

    expect(core.editingRowIdx.value).toBe(-1);
    expect(onSave).toHaveBeenCalledWith({ age: 30, name: 'Alice' }, 0);
  });

  it('saveEdit onSave 返回 false 时应保持编辑态', async () => {
    const onSave = vi.fn(async () => false);
    const core = useProTable<Person>(makeOptions({ editable: { onSave } }));

    core.startEdit(people[0]!, 0);
    await core.saveEdit(0);

    expect(core.editingRowIdx.value).toBe(0);
  });

  it('cancelEdit 应清空编辑行数据并触发 onCancel', () => {
    const onCancel = vi.fn();
    const core = useProTable<Person>(makeOptions({ editable: { onCancel } }));

    core.startEdit(people[2]!, 2);
    core.cancelEdit(people[2], 2);

    expect(core.editingRowIdx.value).toBe(-1);
    expect(core.editRowData).toEqual({});
    expect(onCancel).toHaveBeenCalledWith(people[2], 2);
  });

  it('按钮文案应优先取 props，缺省时回退 i18n 默认值', () => {
    const withText = useProTable<Person>(makeOptions({
      createText: '新建',
      deleteText: '删除',
      editText: '编辑',
    }));
    expect(withText.createBtnText.value).toBe('新建');
    expect(withText.deleteBtnText.value).toBe('删除');
    expect(withText.editBtnText.value).toBe('编辑');

    const fallback = useProTable<Person>(makeOptions());
    // 默认走 zh-CN 词典：common.edit / common.delete / proTable.create
    expect(fallback.editBtnText.value).toBeTruthy();
    expect(fallback.deleteBtnText.value).toBeTruthy();
    expect(fallback.createBtnText.value).toBeTruthy();
  });
});

describe('useProTable 新增弹窗', () => {
  it('handleOpenCreate 有 onCreate 时应打开弹窗并重置表单', () => {
    const onCreate = vi.fn();
    const core = useProTable<Person>(makeOptions({
      onCreate,
      searchFields: [{ key: 'name', label: '姓名' }],
    }));

    core.createFormValues.name = 'draft';
    core.handleOpenCreate();

    expect(core.createDialogOpen.value).toBe(true);
    expect(core.createFormValues.name).toBeUndefined();
  });

  it('handleOpenCreate 无 onCreate 时应触发 pageChange(1, pageSize)', () => {
    const { calls, fn } = makeCollectEmit();
    const core = useProTable<Person>(makeOptions({
      pagination: { current: 1, pageSize: 20, total: 0 },
    }, fn));

    core.handleOpenCreate();

    expect(core.createDialogOpen.value).toBe(false);
    const pageChange = calls.find(([e]) => e === 'pageChange');
    expect(pageChange).toEqual(['pageChange', 1, 20]);
  });

  it('handleCreateSubmit 应透传表单值并关闭弹窗', () => {
    const onCreate = vi.fn();
    const core = useProTable<Person>(makeOptions({
      onCreate,
      searchFields: [{ key: 'name', label: '姓名' }],
    }));

    core.handleOpenCreate();
    core.createFormValues.name = 'Alice';
    core.handleCreateSubmit();

    expect(onCreate).toHaveBeenCalledWith({ name: 'Alice' });
    expect(core.createDialogOpen.value).toBe(false);
  });
});

describe('useProTable 列定义与导出句柄', () => {
  it('renderColumns 应透传 props.columns', () => {
    const core = useProTable<Person>(makeOptions());
    expect(core.renderColumns.value).toStrictEqual(columns);
  });

  it('dataTableRef 初始为 null，exportingApi 为 undefined', () => {
    const core = useProTable<Person>(makeOptions());
    expect(core.dataTableRef.value).toBeNull();
    expect(core.exportingApi.value).toBeUndefined();
  });

  it('写入 dataTableRef 后 exportingApi 应委派其 exporting', () => {
    const core = useProTable<Person>(makeOptions());
    const exporting = { exportCsv: vi.fn() } as unknown as TableExportApi;

    core.dataTableRef.value = { exporting };

    expect(core.exportingApi.value).toStrictEqual(exporting);
  });
});

describe('useProTable 响应式联动', () => {
  it('dataSource 变化应反映到 viewRows', async () => {
    const options = makeOptions();
    const core = useProTable<Person>(options);

    expect(core.tableData.viewRows.value).toHaveLength(3);
    options.setDataSource([{ age: 18, name: 'Dave' }]);
    await nextTick();

    expect(core.tableData.viewRows.value).toEqual([{ age: 18, name: 'Dave' }]);
  });
});
