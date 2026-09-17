/**
 * YdTable 组件测试 —— 验证虚拟滚动 / 聚合行 / 固定列等新特性。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\table\table.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { describe, it, expect } from 'vitest';

import { ColumnDef } from './ColumnDef';
import YdTable from './YdTable.vue';
import YdTableColumn from './YdTableColumn.vue';
import YdTableEmpty from './YdTableEmpty.vue';
import YdTableFooter from './YdTableFooter.vue';

describe('YdTable props', () => {
  it('应包含 virtual prop', () => {
    expect(YdTable.props).toHaveProperty('virtual');
  });

  it('virtual 默认值为 false', () => {
    const prop = YdTable.props.virtual;
    expect(prop.default).toBe(false);
  });

  it('应包含 itemHeight prop', () => {
    expect(YdTable.props).toHaveProperty('itemHeight');
  });

  it('itemHeight 默认值为 40', () => {
    const prop = YdTable.props.itemHeight;
    expect(prop.default).toBe(40);
  });

  it('应包含 overscan prop', () => {
    expect(YdTable.props).toHaveProperty('overscan');
  });

  it('overscan 默认值为 5', () => {
    const prop = YdTable.props.overscan;
    expect(prop.default).toBe(5);
  });

  it('应包含 viewportHeight prop', () => {
    expect(YdTable.props).toHaveProperty('viewportHeight');
  });

  it('viewportHeight 默认值为 400', () => {
    const prop = YdTable.props.viewportHeight;
    expect(prop.default).toBe(400);
  });

  it('应包含 summaryData prop', () => {
    expect(YdTable.props).toHaveProperty('summaryData');
  });
});

describe('ColumnDef type shape', () => {
  it('应能创建 ColumnDef 对象', () => {
    const col: ColumnDef = {
      align: 'left',
      draggable: true,
      fixed: 'left',
      hideable: true,
      isHidden: false,
      isSortable: false,
      label: '名称',
      prop: 'name',
      showOverflowTooltip: false,
      width: '120px',
    };
    expect(col.prop).toBe('name');
    expect(col.fixed).toBe('left');
  });

  it('ColumnDef 应支持三种 fixed 位置', () => {
    const left: ColumnDef = { fixed: 'left', prop: 'a' };
    const right: ColumnDef = { fixed: 'right', prop: 'b' };
    const none: ColumnDef = { prop: 'c' };
    expect(left.fixed).toBe('left');
    expect(right.fixed).toBe('right');
    expect(none.fixed).toBeUndefined();
  });
});

describe('YdTable compound components', () => {
  it('YdTableColumn 应被定义', () => {
    expect(YdTableColumn).toBeDefined();
  });

  it('YdTableEmpty 应被定义', () => {
    expect(YdTableEmpty).toBeDefined();
  });

  it('YdTableFooter 应被定义', () => {
    expect(YdTableFooter).toBeDefined();
  });
});

describe('YdTableEmpty props', () => {
  it('应包含 colspan prop', () => {
    expect(YdTableEmpty.props).toHaveProperty('colspan');
  });

  it('应包含 description prop', () => {
    expect(YdTableEmpty.props).toHaveProperty('description');
  });
});
