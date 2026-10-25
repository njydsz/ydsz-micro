/**
 * useTableExport 单元测试 —— CSV/TSV 序列化与下载触发。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\data-table\use-table-export.test.ts
 * @author ydsz-team
 * @since 5.7.0
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  escapeCsvField,
  serializeTable,
  toCsvContent,
  useTableExport,
} from './use-table-export';

interface Row extends Record<string, unknown> {
  amount: number;
  name: string;
}

const rows: Row[] = [
  { amount: 12, name: '张三' },
  { amount: 34, name: '李,四' },
];

const columns = [
  { key: 'name', label: '姓名' },
  { key: 'amount' },
];

describe('useTableExport', () => {
  beforeEach(() => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('escapeCsvField', () => {
    it('空值应输出空串', () => {
      expect(escapeCsvField(null)).toBe('');
      expect(escapeCsvField(undefined)).toBe('');
    });

    it('含分隔符 / 引号 / 换行时整体加引号', () => {
      expect(escapeCsvField('李,四')).toBe('"李,四"');
      expect(escapeCsvField('a\tb', '\t')).toBe('"a\tb"');
      expect(escapeCsvField('a\nb')).toBe('"a\nb"');
    });

    it('内部双引号应成对翻倍', () => {
      expect(escapeCsvField('说"你好"')).toBe('"说""你好"""');
    });

    it('普通值不加引号', () => {
      expect(escapeCsvField('张三')).toBe('张三');
      expect(escapeCsvField(12)).toBe('12');
    });
  });

  describe('serializeTable', () => {
    it('首行为表头，缺 label 时回退到 key', () => {
      const text = serializeTable({ columns, rows });
      expect(text.split('\r\n')[0]).toBe('姓名,amount');
    });

    it('行之间使用 CRLF，字段按列顺序拼接', () => {
      const text = serializeTable({ columns, rows });
      expect(text).toBe('姓名,amount\r\n张三,12\r\n"李,四",34');
    });

    it('valueResolver 返回值优先，undefined 时回退原始值', () => {
      const text = serializeTable({
        columns,
        rows,
        valueResolver: (row, col) => (col.key === 'amount' ? row.amount * 2 : undefined),
      });
      expect(text.split('\r\n')[1]).toBe('张三,24');
    });
  });

  it('toCsvContent 应前置 UTF-8 BOM', () => {
    expect(toCsvContent({ columns, rows })).toBe(`\uFEFF姓名,amount\r\n张三,12\r\n"李,四",34`);
  });

  describe('useTableExport', () => {
    const api = useTableExport<Row>({
      columns: () => columns,
      fileName: () => 'order-list',
      rows: () => rows,
    });

    it('buildContent 默认逗号并带 BOM', () => {
      expect(api.buildContent()).toBe(`\uFEFF${serializeTable({ columns, rows })}`);
    });

    it('buildContent TSV 使用制表符且不带 BOM', () => {
      expect(api.buildContent('\t')).toBe('姓名\tamount\r\n张三\t12\r\n李,四\t34');
    });

    it('exportCsv 触发下载并回收 objectURL', () => {
      expect(api.exportCsv()).toBe('order-list.csv');

      const link = document.querySelector('a[download]');
      expect(link).toBeNull();
      expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock');
    });

    it('exportTsv 返回 .tsv 文件名', () => {
      expect(api.exportTsv()).toBe('order-list.tsv');
    });

    it('未提供文件名时使用默认名', () => {
      const plain = useTableExport<Row>({ columns: () => columns, rows: () => rows });
      expect(plain.exportCsv()).toBe('table-export.csv');
    });
  });
});
