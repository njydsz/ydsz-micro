/**
 * YdDataTable 数据导出 —— 生成 CSV / TSV 文本并触发浏览器下载。
 *
 * <p>只依赖 Blob 与 a[download]，不引入 xlsx 之类的重型序列化库：
 * Excel、Numbers、WPS 均可直接打开带 UTF-8 BOM 的 .csv。
 *
 * <p>转义遵循 RFC 4180：字段包含分隔符、双引号或换行时整体加引号，
 * 内部双引号成对翻倍。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\data-table\use-table-export.ts
 * @author ydsz-team
 * @since 5.7.0
 */

/** 参与导出的列（结构化子集，避免与 SFC 互相 import 形成环） */
export interface ExportColumn {
  /** 取值字段名 */
  key: string;
  /** 表头文本，缺省用 key */
  label?: string;
}

/** 导出分隔符 */
export type ExportSeparator = ',' | '\t' | ';';

/** 导出参数 */
export interface ExportTableOptions<T extends Record<string, unknown>> {
  /** 需要导出的列（通常传可见列，而不是全量列定义） */
  columns: ExportColumn[];
  /** 文件名（不含扩展名），默认 table-export */
  fileName?: string;
  /** 分隔符，默认逗号 */
  separator?: ExportSeparator;
  /** 行数据 */
  rows: T[];
  /** 单元格取值覆盖：返回 undefined 时回退到 row[key] */
  valueResolver?: (row: T, column: ExportColumn, index: number) => unknown;
}

const DEFAULT_SEPARATOR: ExportSeparator = ',';

const DEFAULT_FILE_NAME = 'table-export';

/**
 * 转义单个 CSV 字段。
 *
 * @param raw - 原始值（null / undefined 输出空串）
 * @param separator - 当前分隔符
 * @returns 可安全拼接的字段文本
 */
export function escapeCsvField(raw: unknown, separator: ExportSeparator = DEFAULT_SEPARATOR): string {
  if (raw === null || raw === undefined) return '';
  const text = typeof raw === 'string' ? raw : String(raw);
  const needsQuote = text.includes(separator)
    || text.includes('"')
    || text.includes('\n')
    || text.includes('\r');
  return needsQuote ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * 把行数据序列化为分隔符文本（首行为表头）。
 *
 * @param options - 导出参数
 * @returns 不含 BOM 的文本内容
 */
export function serializeTable<T extends Record<string, unknown>>(
  options: ExportTableOptions<T>,
): string {
  const {
    columns,
    rows,
    separator = DEFAULT_SEPARATOR,
    valueResolver,
  } = options;

  const lines: string[] = [];
  lines.push(columns.map(col => escapeCsvField(col.label ?? col.key, separator)).join(separator));

  rows.forEach((row, index) => {
    const cells = columns.map((col) => {
      const resolved = valueResolver?.(row, col, index);
      return escapeCsvField(resolved === undefined ? row[col.key] : resolved, separator);
    });
    lines.push(cells.join(separator));
  });

  return lines.join('\r\n');
}

/**
 * 触发浏览器下载并即时回收 objectURL。
 *
 * @param content - 文件文本内容
 * @param fileName - 含扩展名的文件名
 * @param mimeType - MIME 类型
 * @returns 无
 */
export function downloadTextFile(content: string, fileName: string, mimeType: string): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * 生成带文件名的导出文本（CSV 前置 UTF-8 BOM，避免 Excel 中文乱码）。
 *
 * @param options - 导出参数
 * @returns 文本内容
 */
export function toCsvContent<T extends Record<string, unknown>>(
  options: ExportTableOptions<T>,
): string {
  const body = serializeTable({ ...options, separator: options.separator ?? DEFAULT_SEPARATOR });
  return `\uFEFF${body}`;
}

/**
 * 在组件内使用的导出句柄。
 */
export interface TableExportApi {
  /** 导出 CSV（含 BOM），返回文件名 */
  exportCsv: () => string;
  /** 导出 TSV（制表符分隔，便于直接粘贴进电子表格），返回文件名 */
  exportTsv: () => string;
  /** 仅生成文本不落盘，供复制/预览使用 */
  buildContent: (separator?: ExportSeparator) => string;
}

/**
 * useTableExport —— 绑定列与行来源，返回可挂到 defineExpose 的导出 API。
 *
 * @param source - 列 / 行 / 文件名的取值函数（保持与组件响应式状态同步）
 * @returns 导出句柄
 */
export function useTableExport<T extends Record<string, unknown>>(source: {
  columns: () => ExportColumn[];
  fileName?: () => string;
  rows: () => T[];
  valueResolver?: ExportTableOptions<T>['valueResolver'];
}): TableExportApi {
  function buildContent(separator: ExportSeparator = DEFAULT_SEPARATOR): string {
    const body = serializeTable<T>({
      columns: source.columns(),
      rows: source.rows(),
      separator,
      valueResolver: source.valueResolver,
    });
    return separator === ',' ? `\uFEFF${body}` : body;
  }

  function triggerDownload(separator: ExportSeparator, extension: string, mimeType: string): string {
    const fileName = `${source.fileName?.() ?? DEFAULT_FILE_NAME}.${extension}`;
    downloadTextFile(buildContent(separator), fileName, mimeType);
    return fileName;
  }

  return {
    buildContent,
    exportCsv: () => triggerDownload(',', 'csv', 'text/csv'),
    exportTsv: () => triggerDownload('\t', 'tsv', 'text/tab-separated-values'),
  };
}
