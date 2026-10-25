/**
 * YdDataTable 组件测试 —— 排序交互 / loading / 单元格插槽 / formatter / 导出 / 行虚拟化 / 树形展开。
 *
 * <p>覆盖 P0-2 能力拉齐项：表头可点击排序（单列循环 + 多列追加）、受控 sortState、
 * loading 覆盖层与空态互斥、`#cell-{key}` 与 `#cell` 插槽、列 formatter、
 * CSV/TSV 导出句柄、行虚拟滚动占位行、树形展开事件。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\data-table\YdDataTable.test.ts
 * @author ydsz-team
 * @since 5.7.0
 */
import { mount } from '@vue/test-utils';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { h, nextTick } from 'vue';

import YdDataTable from './YdDataTable.vue';

import type { DOMWrapper } from '@vue/test-utils';

import type { DataTableColumnDef } from './types';

interface Person extends Record<string, unknown> {
  age: number;
  city: string;
  name: string;
}

const columns: DataTableColumnDef<Person>[] = [
  { isSortable: true, key: 'name', label: '姓名' },
  { isSortable: true, key: 'age', label: '年龄', sorter: (a, b) => a.age - b.age },
  { key: 'city', label: '城市' },
];

const people: Person[] = [
  { age: 30, city: '福州', name: 'Alice' },
  { age: 25, city: '厦门', name: 'Bob' },
  { age: 30, city: '北京', name: 'Carol' },
];

/**
 * 挂载被测表格。
 *
 * @param extraProps - 追加的 props
 * @param rowOverride - 覆盖默认数据源
 * @returns Vue Test Utils 包装器
 */
function mountTable(
  extraProps: Record<string, unknown> = {},
  rowOverride?: Person[],
) {
  return mount(YdDataTable, {
    attachTo: document.body,
    props: {
      columns,
      dataSource: rowOverride ?? people,
      rowKey: (row: Person) => row.name,
      ...extraProps,
    },
  });
}

/** 取表体数据行（排除占位行与汇总行） */
function dataRows(wrapper: ReturnType<typeof mountTable>) {
  return wrapper.findAll('tbody tr').filter(row => !row.attributes('aria-hidden'));
}

/**
 * 取一行中的单元格（Vue Test Utils 包装器不暴露 DOM 的 `cells` 属性）。
 *
 * @param row - 表体行包装器
 * @returns 该行所有 `<td>` 包装器
 */
function rowCells(row: DOMWrapper<Element>) {
  return row.findAll('td');
}

/**
 * 给滚动容器一个可用的布局尺寸。
 *
 * <p>happy-dom 不做布局，offsetHeight 恒为 0，@tanstack/virtual 会把可视区
 * 判定为空并渲染 0 行；这里直接改写尺寸，让可视窗口与 virtualHeight 对齐。
 *
 * @param height - 模拟的可视区高度（像素）
 * @returns 无
 */
function stubScrollViewport(height: number): void {
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(height);
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(1000);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('YdDataTable', () => {
  // ==================== 表头渲染 ====================

  it('表头应使用列 label 而不是 key', () => {
    const wrapper = mountTable();
    const heads = wrapper.findAll('th').map(th => th.text());

    expect(heads).toEqual(['姓名', '年龄', '城市']);
  });

  // ==================== 单列排序 ====================

  it('点击可排序表头应循环 asc → desc → 取消，并同步 aria-sort', async () => {
    const wrapper = mountTable();
    const nameHead = wrapper.findAll('th')[0];
    const ageHead = wrapper.findAll('th')[1];

    await nameHead.find('button').trigger('click');
    expect(nameHead.attributes('aria-sort')).toBe('ascending');
    expect(wrapper.emitted('sort-change')?.at(-1)).toEqual(['name', 'asc']);

    await nameHead.find('button').trigger('click');
    expect(nameHead.attributes('aria-sort')).toBe('descending');

    await nameHead.find('button').trigger('click');
    expect(nameHead.attributes('aria-sort')).toBe('none');
    expect(wrapper.emitted('sort-change')?.at(-1)).toEqual(['', null]);

    // 自定义 sorter 生效：按年龄升序
    await ageHead.find('button').trigger('click');
    expect(dataRows(wrapper).map(row => rowCells(row)[0].text())).toEqual(['Bob', 'Alice', 'Carol']);
  });

  it('不可排序列不应渲染排序按钮', () => {
    const wrapper = mountTable();
    expect(wrapper.findAll('th')[2].find('button').exists()).toBe(false);
  });

  // ==================== 多列排序 ====================

  it('Shift+点击应追加到排序链并显示次序', async () => {
    const wrapper = mountTable({ multipleSort: true });
    const [nameHead, ageHead] = wrapper.findAll('th');

    await ageHead.find('button').trigger('click', { shiftKey: true });
    await nameHead.find('button').trigger('click', { shiftKey: true });

    const chain = wrapper.emitted('sort-chain-change')?.at(-1)?.[0] as unknown[];
    expect(chain).toHaveLength(2);
    expect(ageHead.find('button').text()).toContain('1');
    expect(nameHead.find('button').text()).toContain('2');

    // 同年龄时按姓名字典序：Alice(30) < Carol(30)，Bob(25) 年龄最小排首位
    expect(dataRows(wrapper).map(row => rowCells(row)[0].text())).toEqual(['Bob', 'Alice', 'Carol']);
  });

  it('受控 sortState 应覆盖内部排序链', async () => {
    const wrapper = mountTable({ sortState: { order: 'desc', prop: 'age' } });
    await wrapper.setProps({ sortState: { order: 'desc', prop: 'age' } });
    await nextTick();

    expect(wrapper.findAll('th')[1].attributes('aria-sort')).toBe('descending');
    // 同年龄保持稳定排序：Alice(30) 仍排在 Carol(30) 之前
    expect(dataRows(wrapper).map(row => rowCells(row)[0].text())).toEqual(['Alice', 'Carol', 'Bob']);
  });

  // ==================== loading ====================

  it('loading 时展示覆盖层、标记 aria-busy 且隐藏空态', () => {
    const wrapper = mountTable({ dataSource: [], loading: true });

    expect(wrapper.find('[role="status"]').exists()).toBe(true);
    expect(wrapper.attributes('aria-busy')).toBe('true');
    expect(wrapper.text()).not.toContain('暂无数据');
    expect(wrapper.text()).toContain('加载中...');
  });

  it('非 loading 的空数据应展示空态', () => {
    const wrapper = mountTable({ dataSource: [] });

    expect(wrapper.find('[role="status"]').exists()).toBe(false);
    expect(wrapper.attributes('aria-busy')).toBe('false');
    expect(wrapper.text()).toContain('暂无数据');
  });

  // ==================== 单元格插槽与 formatter ====================

  it('#cell-{key} 插槽应接管对应列的渲染', () => {
    const wrapper = mount(YdDataTable, {
      props: { columns, dataSource: people, rowKey: (row: Person) => row.name },
      slots: {
        'cell-age': (props: { value: unknown }) => h('b', { class: 'age-cell' }, `${props.value}岁`),
      },
    });

    const cells = wrapper.findAll('.age-cell');
    expect(cells).toHaveLength(3);
    expect(cells[0].text()).toBe('30岁');
  });

  it('#cell 通用插槽应接管未单独定义插槽的列', () => {
    const wrapper = mount(YdDataTable, {
      props: { columns, dataSource: [people[0]!], rowKey: (row: Person) => row.name },
      slots: {
        cell: (props: { column: { key: string } }) =>
          h('span', { class: 'any-cell' }, `[${props.column.key}]`),
      },
    });

    expect(wrapper.findAll('.any-cell').map(cell => cell.text()))
      .toEqual(['[name]', '[age]', '[city]']);
  });

  it('列 formatter 应作用于展示与导出，空值仍兜底为 -', async () => {
    const withFormatter: DataTableColumnDef<Person>[] = [
      { formatter: (row, value) => `${row.name}:${String(value)}`, key: 'age' },
      { key: 'nickname' },
    ];
    const wrapper = mountTable({ columns: withFormatter }, [
      { age: 30, city: '福州', name: 'Alice' },
    ]);

    const cells = wrapper.findAll('tbody td');
    expect(cells[0].text()).toBe('Alice:30');
    expect(cells[1].text()).toBe('-');

    expect(wrapper.vm.exporting.buildContent()).toContain('Alice:30');
  });

  // ==================== 导出 ====================

  it('exporting 句柄应导出表头与全量视图行', () => {
    const wrapper = mountTable({ exportFileName: 'people' });

    const csv = wrapper.vm.exporting.buildContent();
    expect(csv).toBe('\uFEFF姓名,年龄,城市\r\nAlice,30,福州\r\nBob,25,厦门\r\nCarol,30,北京');

    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    expect(wrapper.vm.exporting.exportCsv()).toBe('people.csv');
    expect(wrapper.vm.exporting.exportTsv()).toBe('people.tsv');
  });

  // ==================== 行虚拟化 ====================

  it('virtual 开启后只渲染可见行并补底部占位行', async () => {
    stubScrollViewport(480);
    const big: Person[] = Array.from({ length: 100 }, (_, i) => ({
      age: i,
      city: '福州',
      name: `user-${i}`,
    }));
    const wrapper = mountTable({ virtual: true }, big);
    await nextTick();

    const rendered = dataRows(wrapper);
    expect(rendered.length).toBeGreaterThan(0);
    expect(rendered.length).toBeLessThan(100);

    const spacers = wrapper.findAll('tbody tr[aria-hidden="true"]');
    expect(spacers.length).toBeGreaterThan(0);
    expect(wrapper.attributes('class')).toContain('yd-body-virtual');
  });

  it('virtual 关闭时应渲染全部行', () => {
    const big: Person[] = Array.from({ length: 100 }, (_, i) => ({
      age: i,
      city: '福州',
      name: `user-${i}`,
    }));
    const wrapper = mountTable({}, big);

    expect(dataRows(wrapper)).toHaveLength(100);
  });

  // ==================== 行选择 ====================

  it('勾选行应触发 selection-change 并标记行选中态', async () => {
    const wrapper = mountTable({ isSelectable: true });
    const firstCheckbox = dataRows(wrapper)[0].find('input');

    await firstCheckbox.setChecked();

    expect(wrapper.emitted('selection-change')?.at(-1)).toEqual([['Alice']]);
    expect(dataRows(wrapper)[0].attributes('data-state')).toBe('selected');

    const selectAll = wrapper.find('thead input[type="checkbox"]');
    await selectAll.setChecked();
    expect(wrapper.emitted('selection-change')?.at(-1)).toEqual([['Alice', 'Bob', 'Carol']]);
  });

  // ==================== 树形展开 ====================

  it('树形模式应仅渲染展开路径，切换时发出 update:expandedKeys', async () => {
    const treeData = [
      { age: 1, city: 'A', children: [{ age: 11, city: 'A-1', name: 'child' }], name: 'root' },
    ] as unknown as Person[];
    const wrapper = mountTable({ treeConfig: { childrenKey: 'children' } }, treeData);

    expect(dataRows(wrapper)).toHaveLength(1);

    await wrapper.find('button.yd-tree-toggle').trigger('click');

    expect(wrapper.emitted('update:expandedKeys')?.at(-1)).toEqual([['root']]);
    expect(dataRows(wrapper)).toHaveLength(2);
    expect(rowCells(dataRows(wrapper)[1])[1].text()).toBe('child');
  });

  // ==================== 行内编辑 ====================

  it('双击可编辑单元格进入编辑态，Enter 保存并发出 cell-edit', async () => {
    const editableColumns: DataTableColumnDef<Person>[] = [
      { editable: true, editType: 'input', key: 'name', label: '姓名' },
      { key: 'age', label: '年龄' },
    ];
    const wrapper = mountTable({ columns: editableColumns, editable: true });
    const firstCell = rowCells(dataRows(wrapper)[0])[0];

    expect(firstCell.find('input').exists()).toBe(false);

    await firstCell.trigger('dblclick');
    await nextTick();

    const input = firstCell.find('input');
    expect(input.exists()).toBe(true);
    await input.setValue('Alicia');
    await input.trigger('keydown', { key: 'Enter' });

    expect(wrapper.emitted('cell-edit-start')?.[0]).toEqual(['Alice', 'name']);
    expect(wrapper.emitted('cell-edit')?.at(-1)).toEqual(['Alice', 'name', 'Alicia', people[0]]);
    expect(wrapper.emitted('cell-edit-end')?.at(-1)).toEqual(['Alice', 'name', 'Alicia']);
  });

  it('editValidator 失败时保持编辑态且不发出 cell-edit-end', async () => {
    const editableColumns: DataTableColumnDef<Person>[] = [
      {
        editable: true,
        editValidator: (value) => (value.length < 3 ? '至少 3 个字符' : null),
        key: 'name',
        label: '姓名',
      },
    ];
    const wrapper = mountTable({ columns: editableColumns, editable: true });
    const firstCell = rowCells(dataRows(wrapper)[0])[0];

    await firstCell.trigger('dblclick');
    await nextTick();
    await firstCell.find('input').setValue('Al');
    await firstCell.find('input').trigger('keydown', { key: 'Enter' });

    expect(firstCell.find('input').exists()).toBe(true);
    expect(wrapper.emitted('cell-edit-end')).toBeUndefined();
  });
});
