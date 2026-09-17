/**
 * 数据表格组件的出口集合。
 *
 * YdTable 在语义化 <table> 基础上提供分层结构（YdTable/Header/Body/Row/Cell/HeaderCell/Caption），
 * 不含数据逻辑（排序、筛选、分页），由上层组件或 @tanstack/vue-table 驱动。
 *
 * <p>拆分粒度：
 * <ul>
 *   <li>YdTable —— 外层容器，负责 overflow-auto 与 ref 转发</li>
 *   <li>YdTableHeader / YdTableBody / YdTableFooter —— 语义分组</li>
 *   <li>YdTableRow —— 行容器，支持 hover/selected 状态</li>
 *   <li>YdTableCell / YdTableHead —— 单元格，自动处理 padding/对齐/截断</li>
 *   <li>YdTableCaption —— 表格标题/摘要（无障碍 caption）</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\table\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as YdTable } from './YdTable.vue';
export { default as YdTableBody } from './YdTableBody.vue';
export { default as YdTableCaption } from './YdTableCaption.vue';
export { default as YdTableCell } from './YdTableCell.vue';
export { default as YdTableEmpty } from './YdTableEmpty.vue';
export { default as YdTableFooter } from './YdTableFooter.vue';
export { default as YdTableHead } from './YdTableHead.vue';
export { default as YdTableHeader } from './YdTableHeader.vue';
export { default as YdTableRow } from './YdTableRow.vue';
export type { ColumnDef, TableEmptyProps } from './table.types';
