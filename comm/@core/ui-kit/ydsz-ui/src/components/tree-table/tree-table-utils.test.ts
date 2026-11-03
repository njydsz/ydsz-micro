/**
 * tree-table-utils 单元测试 —— 纯函数：alignClass / getCellValue / formatCellValue / indentStyle / toRenderColumns。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\tree-table\tree-table-utils.test.ts
 * @author ydsz-team
 * @since 26.10.17
 */

import { describe, expect, it } from 'vitest';

import {
  alignClass,
  formatCellValue,
  getCellValue,
  indentStyle,
  toRenderColumns,
} from './tree-table-utils';

interface Row extends Record<string, unknown> {
  id: string;
  name: string | null;
}

describe('alignClass', () => {
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

describe('getCellValue', () => {
  it('无 formatter 时返回原始字段值', () => {
    const row: Row = { id: '1', name: 'hello' };
    expect(getCellValue(row, { key: 'name' })).toBe('hello');
  });

  it('有 formatter 时调用 formatter 并返回结果', () => {
    const row: Row = { id: '1', name: 'hello' };
    const formatter = (r: Row, _col: unknown, raw: unknown) => `formatted:${String(raw)}:${r.id}`;
    expect(getCellValue(row, { formatter, key: 'name' })).toBe('formatted:hello:1');
  });

  it('字段不存在时返回 undefined', () => {
    const row: Row = { id: '1', name: 'hello' };
    expect(getCellValue(row, { key: 'nonexistent' })).toBeUndefined();
  });
});

describe('formatCellValue', () => {
  it('null / undefined 返回空串', () => {
    expect(formatCellValue({ id: '1', name: null }, { key: 'name' })).toBe('');
    expect(formatCellValue({ id: '1', name: undefined }, { key: 'name' })).toBe('');
  });

  it('正常值转为字符串', () => {
    expect(formatCellValue({ id: '1', name: 'x' }, { key: 'name' })).toBe('x');
    expect(formatCellValue({ id: '1', name: 42 }, { key: 'name' })).toBe('42');
  });

  it('formatter 返回值也走格式化', () => {
    const formatter = () => null;
    expect(formatCellValue({ id: '1', name: 'x' }, { formatter, key: 'name' })).toBe('');
  });
});

describe('indentStyle', () => {
  it('depth=0 时 paddingLeft 为 0px', () => {
    expect(indentStyle(0, 24).paddingLeft).toBe('0px');
  });

  it('depth=2, indentSize=24 时 paddingLeft 为 48px', () => {
    expect(indentStyle(2, 24).paddingLeft).toBe('48px');
  });

  it('indentSize 可自定义', () => {
    expect(indentStyle(3, 16).paddingLeft).toBe('48px');
  });
});

describe('toRenderColumns', () => {
  it('列定义转换为渲染视图', () => {
    const columns = [
      { align: 'center' as const, key: 'name', label: 'Name', width: 120 },
      { key: 'id' },
    ];
    expect(toRenderColumns(columns)).toEqual([
      { align: 'center', formatter: undefined, key: 'name', label: 'Name', width: 120 },
      { align: undefined, formatter: undefined, key: 'id', label: 'id', width: undefined },
    ]);
  });

  it('label 缺省时回退为 key', () => {
    expect(toRenderColumns([{ key: 'id' }])[0]!.label).toBe('id');
  });

  it('formatter 字段透传', () => {
    const formatter = (row: Row) => row.name;
    expect(toRenderColumns([{ formatter, key: 'name' }])[0]!.formatter).toBe(formatter);
  });
});
