/**
 * YdProTable 组件测试 —— 只读分支渲染 / 排序父子同步 / loading 透传 / 导出委派。
 *
 * <p>锁定 P0-2 能力拉齐后的复合层契约：ProTable 把表头排序写回自身 useTableData
 * （单一事实源），并把 loading / 虚拟滚动 / 导出句柄透传给内部 YdDataTable。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\pro-table\YdProTable.test.ts
 * @author ydsz-team
 * @since 5.7.0
 */
import { mount } from '@vue/test-utils';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import YdProTable from './YdProTable.vue';

import type { TableColumnDef } from '../../composables/use-table-data';

interface Person extends Record<string, unknown> {
  age: number;
  name: string;
}

const columns: TableColumnDef<Person>[] = [
  { isSortable: true, key: 'name', label: '姓名' },
  { isSortable: true, key: 'age', label: '年龄', sorter: (a, b) => a.age - b.age },
];

const people: Person[] = [
  { age: 30, name: 'Alice' },
  { age: 25, name: 'Bob' },
  { age: 40, name: 'Carol' },
];

/**
 * 挂载被测复合表格。
 *
 * @param extraProps - 追加的 props
 * @returns Vue Test Utils 包装器
 */
function mountProTable(extraProps: Record<string, unknown> = {}) {
  return mount(YdProTable, {
    attachTo: document.body,
    props: {
      columns,
      dataSource: people,
      rowKey: (row: Person) => row.name,
      ...extraProps,
    },
  });
}

/**
 * 取表体首列文本序列，用于断言行序。
 *
 * @param wrapper - 组件包装器
 * @returns 每行第一个单元格的文本
 */
function nameColumn(wrapper: ReturnType<typeof mountProTable>): string[] {
  return wrapper.findAll('tbody tr').map(row => row.findAll('td')[0]?.text() ?? '');
}

beforeEach(() => {
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('YdProTable', () => {
  // ==================== 只读分支渲染 ====================

  it('未开启行内编辑时应由 YdDataTable 渲染全部数据行', () => {
    const wrapper = mountProTable();

    expect(nameColumn(wrapper)).toEqual(['Alice', 'Bob', 'Carol']);
    expect(wrapper.findAll('th').map(th => th.text())).toEqual(['姓名', '年龄']);
  });

  // ==================== 排序父子同步 ====================

  it('点击表头应同时排序视图并写回 ProTable 的 sortState', async () => {
    const wrapper = mountProTable();
    const ageHead = wrapper.findAll('th')[1];

    await ageHead.find('button').trigger('click');

    expect(nameColumn(wrapper)).toEqual(['Bob', 'Alice', 'Carol']);
    expect(wrapper.vm.sortState).toEqual({ order: 'asc', prop: 'age' });

    await ageHead.find('button').trigger('click');

    expect(nameColumn(wrapper)).toEqual(['Carol', 'Alice', 'Bob']);
    expect(wrapper.vm.sortState).toEqual({ order: 'desc', prop: 'age' });
  });

  it('远程模式下点击表头只更新排序状态，不重排传入的数据', async () => {
    const wrapper = mountProTable({ isRemote: true });
    const ageHead = wrapper.findAll('th')[1];

    await ageHead.find('button').trigger('click');

    expect(nameColumn(wrapper)).toEqual(['Alice', 'Bob', 'Carol']);
    expect(wrapper.vm.sortState).toEqual({ order: 'asc', prop: 'age' });
  });

  // ==================== loading 透传 ====================

  it('isLoading 应透传为表格的 aria-busy 状态', () => {
    const idle = mountProTable();
    expect(idle.get('[role="grid"]').attributes('aria-busy')).toBe('false');

    const busy = mountProTable({ isLoading: true });
    expect(busy.get('[role="grid"]').attributes('aria-busy')).toBe('true');
  });

  // ==================== 导出委派 ====================

  it('exposed.exporting 应委派内部表格的 CSV / TSV 序列化', () => {
    const wrapper = mountProTable({ exportFileName: '人员清单' });
    const csv = wrapper.vm.exporting?.buildContent(',');

    expect(csv).toContain('姓名,年龄');
    expect(csv).toContain('Alice,30');
    expect(wrapper.vm.exporting?.exportCsv()).toBe('人员清单.csv');
  });

  it('行内编辑分支不挂载 YdDataTable，导出句柄应为空', () => {
    const wrapper = mountProTable({ editable: true });

    expect(wrapper.vm.exporting).toBeUndefined();
  });
});
