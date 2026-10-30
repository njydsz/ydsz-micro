/**
 * YdDataTable 数据导出 —— 生成 CSV / TSV / HTML-Excel 并触发浏览器下载。
 *
 * <p>只依赖 Blob 与 a[download]，不引入 xlsx 之类的重型序列化库：
 * Excel、Numbers、WPS 均可直接打开带 UTF-8 BOM 的 .csv。
 *
 * <p>转义遵循 RFC 4180：字段包含分隔符、双引号或换行时整体加引号，
 * 内部双引号成对翻倍。
 *
 * <p>提供 exportCsv / exportTsv / exportHtml（Excel 兼容 HTML 表格，
 * 适合需要保留列格式但又不想引入 SheetJS 的场景）。
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
  /**
   * 导出 Excel 兼容格式（HTML table 包装为 .xls，Excel/WPS/Numbers 可直接打开）。
   * <p>不引入 SheetJS，纯 string 拼接，零依赖。
   */
  exportExcel: () => string;
  /** 仅生成文本不落盘，供复制/预览使用 */
  buildContent: (separator?: ExportSeparator) => string;
  /**
   * 仅导出当前选中行（需传 selectedKeys 和 rowKey 函数）。
   * @param selectedKeys - 当前选中的行 key 集合
   * @param rowKeyExtractor - 行 key 提取函数
   */
  exportSelectedCsv: (selectedKeys: Set<string>, rowKeyExtractor: (row: any) => string) => string;
}

/* ============================================================ */
/* HTML-Excel 生成                                                 */
/* ============================================================ */

/**
 * 将值安全地放入 HTML 单元格（仅转义关键字符，避免注入）。
 */
function escapeHtmlCell(raw: unknown): string {
  if (raw === null || raw === undefined) return '';
  const text = typeof raw === 'string' ? raw : String(raw);
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * 构建 Excel 兼容的 HTML 表格文档（可被 Excel/WPS/Numbers 以 .xls 后缀直接打开）。
 *
 * @param options - 导出参数
 * @returns HTML 字符串
 */
export function buildHtmlExcel<T extends Record<string, unknown>>(
  options: ExportTableOptions<T>,
): string {
  const { columns, valueResolver } = options;
  const rows = options.rows;

  const headerCells = columns
    .map((col) => `<th style="background:#f0f0f0;font-weight:bold;padding:4px 8px;border:1px solid #ccc;">${escapeHtmlCell(col.label ?? col.key)}</th>`)
    .join('');

  const bodyRows = rows
    .map((row, index) => {
      const cells = columns
        .map((col) => {
          const resolved = valueResolver?.(row, col, index);
          const val = resolved === undefined ? row[col.key] : resolved;
          return `<td style="padding:4px 8px;border:1px solid #ccc;">${escapeHtmlCell(val)}</td>`;
        })
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('\n');

  return `<html xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><style>table{border-collapse:collapse;font-family:sans-serif;font-size:12px;}</style></head>
<body><table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table></body></html>`;
}

/* ============================================================ */
/* 选中行导出                                                      */
/* ============================================================ */

/**
 * 仅导出选中行（CSV 格式，含 BOM）。
 *
 * @param options - 基础导出参数（用于列和文件名）
 * @param selectedKeys - 当前选中的行 key 集合
 * @param rowKeyExtractor - 行 key 提取函数
 * @returns 带 BOM 的 CSV 文本内容
 */
export function toSelectedCsvContent<T extends Record<string, unknown>>(
  base: Omit<ExportTableOptions<T>, 'rows'>,
  allRows: T[],
  selectedKeys: Set<string>,
  rowKeyExtractor: (row: T) => string,
): string {
  const selectedRows = selectedKeys.size === 0
    ? allRows
    : allRows.filter((row) => selectedKeys.has(rowKeyExtractor(row)));
  return `\uFEFF${serializeTable<T>({ ...base, rows: selectedRows })}`;
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
  /** 行 key 提取函数（用于导出选中行） */
  rowKeyExtractor?: (row: T) => string;
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

  function buildExcelContent(): string {
    return buildHtmlExcel<T>({
      columns: source.columns(),
      rows: source.rows(),
      valueResolver: source.valueResolver,
    });
  }

  function triggerDownload(separator: ExportSeparator, extension: string, mimeType: string): string {
    const fileName = `${source.fileName?.() ?? DEFAULT_FILE_NAME}.${extension}`;
    downloadTextFile(buildContent(separator), fileName, mimeType);
    return fileName;
  }

  function triggerExcelDownload(): string {
    const fileName = `${source.fileName?.() ?? DEFAULT_FILE_NAME}.xls`;
    downloadTextFile(buildExcelContent(), fileName, 'application/vnd.ms-excel');
    return fileName;
  }

  return {
    buildContent,
    exportCsv: () => triggerDownload(',', 'csv', 'text/csv'),
    exportExcel: triggerExcelDownload,
    exportSelectedCsv: (selectedKeys: Set<string>, rowKeyExtractor?: (row: any) => string) => {
      const extractor = rowKeyExtractor ?? source.rowKeyExtractor ?? ((r: any) => String(r));
      const effectiveKeys = selectedKeys ?? new Set<string>();
      const allRows = source.rows();
      const rowsToExport = effectiveKeys.size === 0
        ? allRows
        : allRows.filter((row) => effectiveKeys.has(extractor(row)));
      const fileName = `${source.fileName?.() ?? DEFAULT_FILE_NAME}-selected.csv`;
      const content = `\uFEFF${serializeTable<T>({
        columns: source.columns(),
        rows: rowsToExport,
        separator: ',',
        valueResolver: source.valueResolver,
      })}`;
      downloadTextFile(content, fileName, 'text/csv');
      return fileName;
    },
    exportTsv: () => triggerDownload('\t', 'tsv', 'text/tab-separated-values'),
  };
}
