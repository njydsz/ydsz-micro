/**
 * 数据表格组件的出口集合。
 *
 * Table 在语义化 <table> 基础上提供分层结构（Table/Header/Body/Row/Cell/HeaderCell/Caption），
 * 不含数据逻辑（排序、筛选、分页），由上层组件或 @tanstack/vue-table 驱动。
 *
 * <p>拆分粒度：
 * <ul>
 *   <li>Table —— 外层容器，负责 overflow-auto 与 ref 转发</li>
 *   <li>TableHeader / TableBody / TableFooter —— 语义分组</li>
 *   <li>TableRow —— 行容器，支持 hover/selected 状态</li>
 *   <li>TableCell / TableHead —— 单元格，自动处理 padding/对齐/截断</li>
 *   <li>TableCaption —— 表格标题/摘要（无障碍 caption）</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\table\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as Table } from './Table.vue';
export { default as TableBody } from './TableBody.vue';
export { default as TableCaption } from './TableCaption.vue';
export { default as TableCell } from './TableCell.vue';
export { default as TableEmpty } from './TableEmpty.vue';
export { default as TableFooter } from './TableFooter.vue';
export { default as TableHead } from './TableHead.vue';
export { default as TableHeader } from './TableHeader.vue';
export { default as TableRow } from './TableRow.vue';
export type { ColumnDef, TableEmptyProps } from './table.types';
