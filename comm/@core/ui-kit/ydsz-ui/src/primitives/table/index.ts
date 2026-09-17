/**
 * 数据表格组件的出口集合。
 *
 * <p>YdTable 支持两种模式：
 * <ul>
 *   <li><b>列驱动</b>：&lt;YdTable :data="..."&gt; + &lt;YdTableColumn&gt; / &lt;YdTableColumnGroup&gt;，
 *   父级自动根据列定义渲染 thead/tbody。</li>
 *   <li><b>语义插槽</b>：直接使用 YdTableHeader/YdTableBody/YdTableRow/YdTableCell 等子组件填充。</li>
 * </ul>
 *
 * <p>YdTableColumn / YdTableColumnGroup 是逻辑组件（无可见模板），
 * 仅用于向父级 YdTable 注册列定义。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\table\index.ts
 * @author ydsz-team
 * @since 1.0.0
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
export type { ColumnDef, HeaderRow } from './ColumnDef';
export type { ColumnRegistry } from './injectionKeys';
export { YD_TABLE_COLUMN_REGISTRY } from './injectionKeys';
