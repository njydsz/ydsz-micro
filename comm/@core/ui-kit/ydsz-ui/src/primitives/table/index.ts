/**
 * @file index.ts
 * @description 数据表格组件与数据层状态机的出口集合。
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\table\index.ts
 */
export { default as YdTable } from './YdTable.vue';
export { default as YdTableBody } from './YdTableBody.vue';
export { default as YdTableCaption } from './YdTableCaption.vue';
export { default as YdTableCell } from './YdTableCell.vue';
export { default as YdTableColumn } from './YdTableColumn.vue';
export { default as YdTableColumnGroup } from './YdTableColumnGroup.vue';
export { default as YdTableEmpty } from './YdTableEmpty.vue';
export { default as YdTableFooter } from './YdTableFooter.vue';
export { default as YdTableHead } from './YdTableHead.vue';
export { default as YdTableHeader } from './YdTableHeader.vue';
export { default as YdTableRow } from './YdTableRow.vue';
export { useTableData } from './useTableData';
export type { ColumnDef, FilterOption, HeaderRow } from './ColumnDef';
export type {
  SortState,
  TableDataHandle,
  UseTableDataOptions,
} from './useTableData';
export type { ColumnRegistry } from './injectionKeys';
export { YD_TABLE_COLUMN_REGISTRY } from './injectionKeys';
