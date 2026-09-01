/**
 * VXe Table 增强插件的统一导出入口。
 *
 * 提供表格初始化（setupYDSZVxeTable）、组合式函数（useYDSZVxeGrid）、
 * 命令式 API 类型与内置格式化器，封装搜索表单 + 表格 + 工具栏的一站式能力。
 *
 * @path comm\effects\plugins\src\vxe-table\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { setupYDSZVxeTable } from './init';
export type { VxeTableGridOptions } from './types';
export * from './use-vxe-grid';

export { default as YDSZVxeGrid } from './use-vxe-grid.vue';
export {
  useVxeGridLogic,
} from './composables/use-vxe-grid-logic';
export type {
  VxeGridLogicProps,
  UseVxeGridLogicReturn,
} from './composables/use-vxe-grid-logic';
export type {
  VxeGridListeners,
  VxeGridProps,
  VxeGridPropTypes,
} from 'vxe-table';
