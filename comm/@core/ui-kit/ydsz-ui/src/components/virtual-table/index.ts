/**
 * VirtualTable 虚拟表格组件入口。
 *
 * <p>聚合虚拟列表 YdVirtualList 与虚拟表格 YdVirtualTable 以及类型定义，
 * 作为 @see useVirtualList / @see YdVirtualList / @see YdVirtualTable 的统一对外出口。
 *
 * @module components/virtual-table
 * @author ydsz-team
 * @since 1.0.0 (26.09.17 重构：新增 YdVirtualList 通用组件)
 */

export { default as YdVirtualList } from './YdVirtualList.vue';
export { default as YdVirtualTable } from './YdVirtualTable.vue';
export type { VirtualListProps } from './virtual-list-types';
export type { VirtualTableColumn } from './YdVirtualTable.vue';
