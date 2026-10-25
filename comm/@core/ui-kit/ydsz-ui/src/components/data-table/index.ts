/**
 * YdDataTable 数据表格组件 —— 行选择 / 单列与多列排序 / 筛选 / 固定列 / 多级表头 /
 * 列与行虚拟滚动 / 行内编辑 / 单元格插槽 / CSV·TSV 导出。
 *
 * @module components/data-table
 * @author ydsz-team
 * @since 5.6.0
 */

export { default as YdDataTable } from './YdDataTable.vue';
export { default as YdDataTableCell } from './YdDataTableCell.vue';
export { default as YdDataTableHeadCell } from './YdDataTableHeadCell.vue';
export type {
  CellEditOption,
  CellEditType,
  CellSlotProps,
  ColumnView,
  DataTableColumnDef,
  HeaderSlotProps,
  RowView,
  SummaryRowFn,
  TreeConfig,
  TreeFlatRow,
} from './types';
export type { TableColumnDef } from '../../composables/use-table-data';
export { useTableEditing } from '../../composables/use-table-editing';
export type {
  UseTableEditingOptions,
  UseTableEditingReturn,
} from '../../composables/use-table-editing';
export { useTableCellEdit } from './use-table-cell-edit';
export type {
  UseTableCellEditOptions,
  UseTableCellEditReturn,
} from './use-table-cell-edit';
export { useTableColumnLayout } from './use-table-column-layout';
export type {
  TableColumnLayoutOptions,
  TableColumnLayoutResult,
} from './use-table-column-layout';
export { useTableRowView } from './use-table-row-view';
export type {
  TableRowViewOptions,
  TableRowViewResult,
} from './use-table-row-view';
export { useFixedColumns, fixedColumnStyle } from './use-table-fixed-columns';
export { useTableGroupHeader } from './use-table-group-header';
export {
  downloadTextFile,
  escapeCsvField,
  serializeTable,
  toCsvContent,
  useTableExport,
} from './use-table-export';
export type {
  ColumnFixedConfig,
  FixedColumnsResult,
  FixedColumnStyle,
} from './use-table-fixed-columns';
export type {
  ExportColumn,
  ExportSeparator,
  ExportTableOptions,
  TableExportApi,
} from './use-table-export';
export type {
  GroupHeaderResult,
  HeaderCell,
  HeaderRow,
  TableColumn,
} from './use-table-group-header';
