/**
 * YDSZSegmented 及其数据类型的出口。
 *
 * 类型与组件一起导出，是因为分段数组通常由调用方在外部组装，
 * 缺少 SegmentedItem 类型就只能在调用处重复声明一次结构。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\components\segmented\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as YDSZSegmented } from './segmented.vue';

export type * from './types';
