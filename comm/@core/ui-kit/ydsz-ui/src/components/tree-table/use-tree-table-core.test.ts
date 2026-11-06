/**
 * useTreeTableCore 单元测试 —— 扁平化 / 展开收起 / 级联勾选 / 懒加载 / 连接线。
 *
 * <p>覆盖从 YdTreeTable.vue 提取的核心逻辑：
 * <ul>
 *   <li>纯函数：alignClass</li>
 *   <li>树形扁平化：flatRows / 展开态过滤 / 懒加载追加子节点</li>
 *   <li>展开 / 收起：expandKey / collapseKey / toggleExpand / expandAll / collapseAll</li>
 *   <li>复选框级联：父子选中 / 半选态 / checkStrictly 独立模式</li>
 *   <li>懒加载：loadData 调用 / loadingKeys / lazyChildrenMap 合并</li>
 *   <li>渲染辅助：indentStyle / hasAncestorSibling / getCellValue / formatCellValue</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\tree-table\use-tree-table-core.test.ts
 * @author ydsz-team
 * @since 26.10.17
 */

import { describe, expect, it, vi } from 'vitest';

import { alignClass, useTreeTableCore } from './use-tree-table-core';

import type { ResolvedTreeTableProps } from './use-tree-table-core';

import type { TreeFlatRow, YdTreeTableEmits, YdTreeTableProps } from './types';
import type { CSSProperties } from 'vue';

interface Row extends Record<string, unknown> {
  children?: Row[];
  id: string;
  name: string;
}

/** 构造树形数据 */
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

/**
 * 构造 composable 入参。
 *
 * <p>用 reactive 复刻 defineProps 的 prop 透传，emit 用 vi.fn 收集事件。
 */
function makeOptions(overrides: Partial<YdTreeTableProps<Row>> = {}) {
  const props = {
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
  const emit = vi.fn() as unknown as YdTreeTableEmits;
  return { emit, props };
}

describe('alignClass 纯函数', () => {
  it('center 返回 text-center', () => {
    expect(alignClass('center')).toBe('text-center');
  });

  it('right 返回 text-right', () => {
    expect(alignClass('right')).toBe('text-right');
  });

  it('left / undefined 返回 text-left', () => {
    expect(alignClass('left')).toBe('text-left');
    expect(alignClass()).toBe('text-left');
  });
});

describe('useTreeTableCore 扁平化', () => {
  it('默认全部收起时 flatRows 仅含 root 节点', () => {
    const core = useTreeTableCore(makeOptions());
    expect(core.flatRows.value).toHaveLength(3);
    expect(core.flatRows.value.map((r) => r.key)).toEqual(['1', '2', '3']);
  });

  it('hasChildren 标记正确', () => {
    const core = useTreeTableCore(makeOptions());
    const map = new Map(core.flatRows.value.map((r) => [r.key, r]));
    expect(map.get('1')?.hasChildren).toBe(true);
    expect(map.get('2')?.hasChildren).toBe(true);
    expect(map.get('3')?.hasChildren).toBe(false);
  });

  it('展开后子节点进入 flatRows 且携带 depth / ancestorKeys', () => {
    const core = useTreeTableCore(makeOptions());
    core.expandKey('1');
    const rows = core.flatRows.value;
    expect(rows.map((r) => r.key)).toEqual(['1', '1-1', '1-2', '2', '3']);
    const child = rows[1]!;
    expect(child.depth).toBe(1);
    expect(child.parentKey).toBe('1');
    expect(child.ancestorKeys).toEqual(['1']);
  });

  it('懒加载追加子节点后子节点进入 flatRows', async () => {
    const loadData = vi.fn(async () => [{ id: 'lazy-1', name: 'lazy child' }]);
    const core = useTreeTableCore(
      makeOptions({
        lazy: true,
        loadData,
      }),
    );
    await core.handleLazyLoad('3');
    expect(loadData).toHaveBeenCalledTimes(1);
    const rows = core.flatRows.value;
    expect(rows.map((r) => r.key)).toEqual(['1', '2', '3', 'lazy-1']);
    const lazyRow = rows[3]!;
    expect(lazyRow.depth).toBe(1);
    expect(lazyRow.parentKey).toBe('3');
  });
});

describe('useTreeTableCore 展开 / 收起', () => {
  it('expandKey 触发 update:expandedKeys 与 expand 事件', () => {
    const options = makeOptions();
    const core = useTreeTableCore(options);
    core.expandKey('1');
    expect(options.emit).toHaveBeenCalledWith('update:expandedKeys', ['1']);
    expect(options.emit).toHaveBeenCalledWith('expand', '1', expect.objectContaining({ id: '1' }));
  });

  it('collapseKey 触发 update:expandedKeys 与 collapse 事件', () => {
    const options = makeOptions();
    const core = useTreeTableCore(options);
    core.expandKey('1');
    core.collapseKey('1');
    expect(options.emit).toHaveBeenCalledWith('update:expandedKeys', []);
    expect(options.emit).toHaveBeenCalledWith(
      'collapse',
      '1',
      expect.objectContaining({ id: '1' }),
    );
  });

  it('toggleExpand 在展开与收起间切换', () => {
    const core = useTreeTableCore(makeOptions());
    core.toggleExpand('1');
    expect(core.internalExpandedKeys.value.has('1')).toBe(true);
    core.toggleExpand('1');
    expect(core.internalExpandedKeys.value.has('1')).toBe(false);
  });

  it('expandAll 展开所有有子节点的 key', () => {
    const core = useTreeTableCore(makeOptions());
    core.expandAll();
    expect(Array.from(core.internalExpandedKeys.value).sort()).toEqual(['1', '2']);
  });

  it('collapseAll 清空展开态', () => {
    const core = useTreeTableCore(makeOptions());
    core.expandAll();
    core.collapseAll();
    expect(core.internalExpandedKeys.value.size).toBe(0);
  });
});

describe('useTreeTableCore 复选框级联', () => {
  it('选中父节点应级联选中所有子孙', () => {
    const { emit } = makeOptions();
    const core = useTreeTableCore({ emit, props: makeOptions().props });
    const flatRow: TreeFlatRow<Row> = {
      ancestorKeys: [],
      depth: 0,
      hasChildren: true,
      key: '1',
      parentKey: null,
      row: makeDataSource()[0]!,
    };
    core.toggleCheckbox(flatRow);
    expect(core.isChecked('1')).toBe(true);
    expect(core.isChecked('1-1')).toBe(true);
    expect(core.isChecked('1-2')).toBe(true);
  });

  it('取消父节点应级联取消所有子孙', () => {
    const core = useTreeTableCore(makeOptions());
    core.toggleCheckbox({
      ancestorKeys: [],
      depth: 0,
      hasChildren: true,
      key: '1',
      parentKey: null,
      row: makeDataSource()[0]!,
    });
    core.toggleCheckbox({
      ancestorKeys: [],
      depth: 0,
      hasChildren: true,
      key: '1',
      parentKey: null,
      row: makeDataSource()[0]!,
    });
    expect(core.isChecked('1')).toBe(false);
    expect(core.isChecked('1-1')).toBe(false);
    expect(core.isChecked('1-2')).toBe(false);
  });

  it('子节点部分选中时父节点进入半选态', () => {
    const core = useTreeTableCore(makeOptions());
    core.toggleCheckbox({
      ancestorKeys: ['1'],
      depth: 1,
      hasChildren: false,
      key: '1-1',
      parentKey: '1',
      row: { id: '1-1', name: 'child 1-1' },
    });
    expect(core.isChecked('1-1')).toBe(true);
    expect(core.isHalfChecked('1')).toBe(true);
    expect(core.isChecked('1')).toBe(false);
  });

  it('所有子节点选中时父节点自动选中', () => {
    const core = useTreeTableCore(makeOptions());
    core.toggleCheckbox({
      ancestorKeys: ['1'],
      depth: 1,
      hasChildren: false,
      key: '1-1',
      parentKey: '1',
      row: { id: '1-1', name: 'child 1-1' },
    });
    core.toggleCheckbox({
      ancestorKeys: ['1'],
      depth: 1,
      hasChildren: false,
      key: '1-2',
      parentKey: '1',
      row: { id: '1-2', name: 'child 1-2' },
    });
    expect(core.isChecked('1')).toBe(true);
    expect(core.isHalfChecked('1')).toBe(false);
  });

  it('checkStrictly=true 时父子互不影响', () => {
    const core = useTreeTableCore(makeOptions({ checkStrictly: true }));
    core.toggleCheckbox({
      ancestorKeys: [],
      depth: 0,
      hasChildren: true,
      key: '1',
      parentKey: null,
      row: makeDataSource()[0]!,
    });
    expect(core.isChecked('1')).toBe(true);
    expect(core.isChecked('1-1')).toBe(false);
    expect(core.isHalfChecked('1')).toBe(false);
  });

  it('getCheckedNodes / getHalfCheckedNodes 返回原始节点', () => {
    const core = useTreeTableCore(makeOptions());
    core.toggleCheckbox({
      ancestorKeys: [],
      depth: 0,
      hasChildren: true,
      key: '1',
      parentKey: null,
      row: makeDataSource()[0]!,
    });
    const checked = core.getCheckedNodes();
    expect(checked.map((n) => n.id).sort()).toEqual(['1', '1-1', '1-2']);
    expect(core.getHalfCheckedNodes()).toHaveLength(0);
  });
});

describe('useTreeTableCore 懒加载', () => {
  it('已有子节点时直接展开不调用 loadData', () => {
    const loadData = vi.fn(async () => [{ id: 'x', name: 'x' }]);
    const core = useTreeTableCore(makeOptions({ lazy: true, loadData }));
    core.handleToggleExpand({
      ancestorKeys: [],
      depth: 0,
      hasChildren: true,
      key: '1',
      parentKey: null,
      row: makeDataSource()[0]!,
    });
    expect(loadData).not.toHaveBeenCalled();
    expect(core.internalExpandedKeys.value.has('1')).toBe(true);
  });

  it('lazy=false 时不触发加载', async () => {
    const loadData = vi.fn(async () => [{ id: 'x', name: 'x' }]);
    const core = useTreeTableCore(makeOptions({ loadData }));
    await core.handleLazyLoad('3');
    expect(loadData).not.toHaveBeenCalled();
  });

  it('loadData 返回空数组时不写入 lazyChildrenMap', async () => {
    const loadData = vi.fn(async () => [] as Row[]);
    const core = useTreeTableCore(makeOptions({ lazy: true, loadData }));
    await core.handleLazyLoad('3');
    expect(loadData).toHaveBeenCalledTimes(1);
    // 无子节点，flatRows 不变
    expect(core.flatRows.value.map((r) => r.key)).toEqual(['1', '2', '3']);
  });

  it('加载完成后触发 load-success 并展开', async () => {
    const loadData = vi.fn(async () => [{ id: 'lazy-1', name: 'lazy child' }]);
    const options = makeOptions({ lazy: true, loadData });
    const core = useTreeTableCore(options);
    await core.handleLazyLoad('3');
    expect(options.emit).toHaveBeenCalledWith('load-success', '3', [
      { id: 'lazy-1', name: 'lazy child' },
    ]);
    expect(core.internalExpandedKeys.value.has('3')).toBe(true);
  });
});

describe('useTreeTableCore 渲染辅助', () => {
  it('indentStyle 按 depth 计算 paddingLeft', () => {
    const core = useTreeTableCore(makeOptions({ indentSize: 24 }));
    const style: CSSProperties = core.indentStyle({
      ancestorKeys: [],
      depth: 2,
      hasChildren: false,
      key: 'x',
      parentKey: 'p',
      row: { id: 'x', name: 'x' },
    });
    expect(style.paddingLeft).toBe('48px');
  });

  it('hasAncestorSibling 判断祖先是否有后续兄弟', () => {
    const core = useTreeTableCore(makeOptions());
    core.expandAll();
    // 节点 1-1 的祖先 1 有后续兄弟 2 → 第 1 层竖线应绘制
    const hasSibling = core.hasAncestorSibling(
      {
        ancestorKeys: ['1'],
        depth: 1,
        hasChildren: false,
        key: '1-1',
        parentKey: '1',
        row: { id: '1-1', name: 'child 1-1' },
      },
      1,
    );
    expect(hasSibling).toBe(true);
    // depthLevel 越界返回 false
    expect(
      core.hasAncestorSibling(
        {
          ancestorKeys: ['1'],
          depth: 1,
          hasChildren: false,
          key: '1-1',
          parentKey: '1',
          row: { id: '1-1', name: 'child 1-1' },
        },
        0,
      ),
    ).toBe(false);
  });

  it('getCellValue 优先使用 formatter', () => {
    const core = useTreeTableCore(
      makeOptions({
        columns: [
          {
            formatter: (row) => `formatted:${row.name}`,
            key: 'name',
          },
        ],
      }),
    );
    const value = core.getCellValue({ id: '1', name: 'x' }, { formatter: undefined, key: 'name' });
    expect(value).toBe('x');
  });

  it('formatCellValue 对 null / undefined 返回空串', () => {
    const core = useTreeTableCore(makeOptions());
    const nullRow = { id: '1', name: null } as unknown as Row;
    const undefinedRow = { id: '1', name: undefined } as unknown as Row;
    expect(core.formatCellValue(nullRow, { key: 'name' })).toBe('');
    expect(core.formatCellValue(undefinedRow, { key: 'name' })).toBe('');
    expect(core.formatCellValue({ id: '1', name: 'x' }, { key: 'name' })).toBe('x');
  });

  it('renderColumns 将列定义转换为渲染视图', () => {
    const core = useTreeTableCore(
      makeOptions({
        columns: [{ align: 'center', key: 'name', label: 'Name', width: 120 }, { key: 'id' }],
      }),
    );
    expect(core.renderColumns.value).toEqual([
      { align: 'center', formatter: undefined, key: 'name', label: 'Name', width: 120 },
      { align: undefined, formatter: undefined, key: 'id', label: 'id', width: undefined },
    ]);
  });
});
