/**
 * 抽屉子模块的类型出口：对外只暴露 drawer.ts 中的类型契约。
 *
 * 组件与 API 由上层 src/index.ts 统一导出，此处不重复暴露实现，
 * 避免同一符号出现两条引入路径。
 *
 * @path comm\@core\ui-kit\popup-ui\src\drawer\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export type * from './drawer';
export { default as YDSZDrawer } from './drawer.vue';
export { setDefaultDrawerProps, useYDSZDrawer } from './use-drawer';
