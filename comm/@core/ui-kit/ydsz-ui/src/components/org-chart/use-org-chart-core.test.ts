/**
 * useOrgChartCore 单元测试 —— 过滤 / 展开 / 选择 / 连接线样式。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\org-chart\use-org-chart-core.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { describe, expect, it, vi } from 'vitest';

import {
  filterTreeNodes,
  flattenNodes,
  getConnectorBorderStyle,
  hasChildren,
  useOrgChartCore,
} from './use-org-chart-core';

import type { UseOrgChartCoreOptions } from './use-org-chart-core';

import type { OrgChartEmits, OrgChartNode, OrgChartProps } from './org-chart-types';

function makeNodes(): OrgChartNode[] {
  return [
    {
      children: [
        { id: 'child-1', label: 'Child One' },
        { id: 'child-2', label: 'Child Two' },
      ],
      id: 'root',
      label: 'Root',
    },
    { id: 'leaf', label: 'Leaf' },
  ];
}

function makeOptions(overrides: Partial<OrgChartProps> = {}): UseOrgChartCoreOptions {
  return {
    emit: vi.fn() as unknown as OrgChartEmits,
    props: {
      connectorStyle: 'solid',
      filter: false,
      filterBy: 'label',
      value: makeNodes(),
      ...overrides,
    },
  };
}

describe('组织图纯函数', () => {
  it('flattenNodes 递归展开所有节点', () => {
    expect(flattenNodes(makeNodes()).map((node) => node.id)).toEqual([
      'root',
      'child-1',
      'child-2',
      'leaf',
    ]);
  });

  it('hasChildren 仅对非空 children 返回 true', () => {
    expect(hasChildren(makeNodes()[0]!)).toBe(true);
    expect(hasChildren(makeNodes()[1]!)).toBe(false);
  });

  it('getConnectorBorderStyle 返回契约样式', () => {
    expect(getConnectorBorderStyle('dashed')).toBe('border-dashed');
    expect(getConnectorBorderStyle('dotted')).toBe('border-dotted');
    expect(getConnectorBorderStyle('solid')).toBe('border-solid');
  });

  it('filterTreeNodes 保留匹配节点及命中子节点的祖先链', () => {
    const result = filterTreeNodes(makeNodes(), 'child one', 'label');
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('root');
    expect(result[0]?.children?.map((node) => node.id)).toEqual(['child-1']);
  });
});

describe('useOrgChartCore', () => {
  it('按 expanded 标记初始化并切换展开状态', () => {
    const options = makeOptions({ collapsible: true });
    const core = useOrgChartCore(options);
    expect(core.isExpanded(makeNodes()[0]!)).toBe(true);

    core.toggleExpand(makeNodes()[0]!);
    expect(core.isExpanded(makeNodes()[0]!)).toBe(false);
    expect(options.emit).toHaveBeenCalledWith(
      'node-collapse',
      expect.objectContaining({ id: 'root' }),
    );
  });

  it('单选模式切换选中状态并同步 selection', () => {
    const options = makeOptions({ selectionMode: 'single' });
    const core = useOrgChartCore(options);
    const node = makeNodes()[0]!;

    core.toggleSelect(node);
    expect(core.isSelected(node)).toBe(true);
    expect(options.emit).toHaveBeenCalledWith('update:selection', node);
    expect(options.emit).toHaveBeenCalledWith('node-select', node);

    core.toggleSelect(node);
    expect(core.isSelected(node)).toBe(false);
    expect(options.emit).toHaveBeenCalledWith('update:selection', null);
    expect(options.emit).toHaveBeenCalledWith('node-unselect', node);
  });

  it('多选模式返回所有选中节点', () => {
    const options = makeOptions({ selectionMode: 'multiple' });
    const core = useOrgChartCore(options);
    const [root, leaf] = makeNodes();

    core.toggleSelect(root!);
    core.toggleSelect(leaf!);
    expect(core.isSelected(root!)).toBe(true);
    expect(core.isSelected(leaf!)).toBe(true);
    expect(options.emit).toHaveBeenLastCalledWith('update:selection', [root, leaf]);
  });

  it('过滤关闭时返回原始节点；开启时按关键字过滤', () => {
    const core = useOrgChartCore(makeOptions({ filter: true }));
    expect(core.filteredNodes.value).toHaveLength(2);

    core.filterText.value = 'child one';
    expect(core.filteredNodes.value).toHaveLength(1);
    expect(core.filteredNodes.value[0]?.id).toBe('root');
  });

  it('返回连接线样式与节点卡片样式', () => {
    const core = useOrgChartCore(makeOptions({ connectorStyle: 'dashed' }));
    expect(core.connectorBorder.value).toBe('border-dashed');
    expect(core.getNodeClasses(makeNodes()[1]!)).toContain('border-primary/10');
  });
});
