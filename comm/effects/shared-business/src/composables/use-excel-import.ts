/**
 * use-excel-import 组合式函数 — 统一 Excel 导入
 *
 * @path comm\effects\shared-business\src\composables\use-excel-import.ts
 * @author ydsz-team
 * @since 1.1.0
 *
 * @remarks
 * 基于 SheetJS(xlsx) 解析文件内容，支持：
 * - 表头映射（Excel 表头 → 数据字段）
 * - 数据校验回调（返回错误行）
 * - 错误行反馈
 */
import * as XLSX from 'xlsx';

/**
 * Excel 导入列映射配置
 *
 * 定义 Excel 表头与数据字段之间的映射关系。
 *
 * @since 1.1.0
 */
export interface ExcelImportColumn {
  /** Excel 中的表头文字 */
  header: string;
  /** 映射后的数据字段 key */
  key: string;
  /** 是否必填，为空时记录会被归入 errors */
  required?: boolean;
}

/**
 * Excel 导入解析结果
 *
 * @typeParam T - 数据行类型
 * @since 1.1.0
 */
export interface ExcelImportResult<T = any> {
  /** 解析成功的数据行 */
  data: T[];
  /** 有错误的行（rowIndex 从 2 开始，第 1 行为表头） */
  errors: Array<{ rowIndex: number; message: string }>;
  /** 总行数（不含表头） */
  total: number;
}

/**
 * Excel 导入配置项
 *
 * @typeParam T - 数据行类型
 * @since 1.1.0
 */
export interface ExcelImportOptions<T = any> {
  /** 列映射配置 */
  columns: ExcelImportColumn[];
  /** 自定义校验函数：返回错误消息字符串，null 表示通过 */
  validator?: (row: T, rowIndex: number) => string | null;
}

/**
 * 统一 Excel 导入 composable
 *
 * 基于 SheetJS (xlsx) 解析 Excel 文件，支持列映射、必填校验和自定义校验。
 * 适合中小数据量（< 1 万行）的导入场景。
 *
 * @typeParam T - 数据行类型
 * @returns 导入工具方法
 * @returns parseExcel - 解析 Excel File 对象为结构化数据
 *
 * @example
 * ```ts
 * const { parseExcel } = useExcelImport<ProjectItem>();
 *
 * async function onFileChange(file: File) {
 *   const result = await parseExcel(file, {
 *     columns: [
 *       { header: '项目名称', key: 'name', required: true },
 *       { header: '金额', key: 'amount' },
 *     ],
 *     validator: (row, idx) => {
 *       if (Number(row.amount) <= 0) return `第 ${idx} 行金额必须大于 0`;
 *       return null;
 *     },
 *   });
 *   if (result.errors.length > 0) {
 *     message.warning(`${result.errors.length} 行数据校验失败`);
 *   }
 *   importData(result.data);
 * }
 * ```
 *
 * @since 1.1.0
 */
export function useExcelImport<T = any>() {
  function parseExcel(
    file: File,
    options: ExcelImportOptions<T>,
  ): Promise<ExcelImportResult<T>> {
    const { columns, validator } = options;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const buffer = event.target?.result as ArrayBuffer;
          const workbook = XLSX.read(buffer, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          // 表头行作为首行，后续为数据
          const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(
            firstSheet,
            { defval: '' },
          );

          const data: T[] = [];
          const errors: Array<{ rowIndex: number; message: string }> = [];

          rawRows.forEach((rawRow, idx) => {
            // Excel 行号 = idx + 2（表头占 1 行，sheet_to_json 从 0 开始）
            const rowIndex = idx + 2;
            const row = {} as Record<string, any>;
            let rowError: string | null = null;

            for (const col of columns) {
              const rawValue = rawRow[col.header] ?? '';
              row[col.key] = rawValue;
              if (col.required && (rawValue === '' || rawValue == null)) {
                rowError = `第 ${rowIndex} 行【${col.header}】不能为空`;
                break;
              }
            }

            if (rowError) {
              errors.push({ rowIndex, message: rowError });
              return;
            }

            if (validator) {
              const msg = validator(row as T, rowIndex);
              if (msg) {
                errors.push({ rowIndex, message: msg });
                return;
              }
            }

            data.push(row as T);
          });

          resolve({ data, errors, total: rawRows.length });
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsArrayBuffer(file);
    });
  }

  return { parseExcel };
}
