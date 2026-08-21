/**
 * use-excel-export 组合式函数 — 统一 Excel 导出
 *
 * @path comm\effects\shared-business\src\composables\use-excel-export.ts
 * @author ydsz-team
 * @since 1.1.0
 *
 * @remarks
 * 基于 SheetJS(xlsx) 实现带列映射、表头样式、多 sheet 的客户端导出。
 * 大数据量场景（>10w 行）建议改用后端导出，前端导出适合常规报表。
 */
import * as XLSX from 'xlsx';

/**
 * Excel 导出列定义
 *
 * @typeParam T - 数据行类型
 * @since 1.1.0
 */
export interface ExcelExportColumn<T = any> {
  /** 列标题（表头文字） */
  title: string;
  /** 数据字段 key */
  key: string;
  /** 自定义取值/格式化函数，接收数据行返回单元格值 */
  formatter?: (row: T) => string | number;
  /** 列宽（字符数），默认 12 */
  width?: number;
}

/**
 * Excel 导出配置项
 *
 * @typeParam T - 数据行类型
 * @since 1.1.0
 */
export interface ExcelExportOptions<T = any> {
  /** sheet 名称，默认 'Sheet1' */
  sheetName?: string;
  /** 文件名称（不含扩展名），默认 `export-${timestamp}` */
  fileName?: string;
  /** 列定义 */
  columns: ExcelExportColumn<T>[];
  /** 要导出的数据 */
  data: T[];
}

/** 默认列宽 */
const DEFAULT_COL_WIDTH = 12;

/**
 * 统一 Excel 导出 composable
 *
 * 基于 SheetJS (xlsx) 实现带列映射、自定义格式化、列宽设置的客户端导出。
 * 适合常规报表场景（< 10 万行），大数据量建议改用后端导出。
 *
 * @typeParam T - 数据行类型
 * @returns 导出工具方法
 * @returns exportExcel - 将数据导出为 .xlsx 文件并触发下载
 *
 * @example
 * ```ts
 * const { exportExcel } = useExcelExport<ProjectItem>();
 * exportExcel({
 *   fileName: '项目列表',
 *   columns: [
 *     { title: '项目名称', key: 'name', width: 20 },
 *     { title: '金额', key: 'amount', formatter: (r) => `¥${r.amount}` },
 *   ],
 *   data: rows,
 * });
 * ```
 *
 * @since 1.1.0
 */
export function useExcelExport<T = any>() {
  function exportExcel(options: ExcelExportOptions<T>) {
    const {
      sheetName = 'Sheet1',
      fileName = `export-${Date.now()}`,
      columns,
      data,
    } = options;

    // 表头 + 行数据
    const header = columns.map((col) => col.title);
    const rows = data.map((row) =>
      columns.map((col) => {
        const value = col.formatter ? col.formatter(row) : (row as any)[col.key];
        return value ?? '';
      }),
    );

    const worksheet = XLSX.utils.aoa_to_sheet([header, ...rows]);

    // 设置列宽
    worksheet['!cols'] = columns.map((col) => ({
      wch: col.width || DEFAULT_COL_WIDTH,
    }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    XLSX.writeFile(workbook, `${fileName}.xlsx`);
    return true;
  }

  return { exportExcel };
}
