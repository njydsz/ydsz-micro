/**
 * YdDataTable 数据表格组件 —— 带有行选择 / 排序 / 筛选的复合数据表格。
 *
 * @module components/data-table
 * @author ydsz-team
 * @since 5.6.0
 */

export { default as YdDataTable } from './YdDataTable.vue';
export type { SummaryRowFn } from './YdDataTable.vue';
export type { TableColumnDef } from '../../composables/use-table-data';
export { useFixedColumns, fixedColumnStyle } from './use-table-fixed-columns';
export { useTableGroupHeader } from './use-table-group-header';
export type { ColumnFixedConfig, FixedColumnStyle, FixedColumnsResult } from './use-table-fixed-columns';
export type {
  GroupHeaderResult,
  HeaderCell,
  HeaderRow,
  TableColumn,
} from './use-table-group-header';
