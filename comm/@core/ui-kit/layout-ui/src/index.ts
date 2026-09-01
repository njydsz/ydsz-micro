/**
 * layout-ui 的包出口：对外只给出 YDSZAdminLayout 组件及其 props 类型。
 *
 * 内部组件（LayoutHeader / LayoutSidebar / LayoutContent 等）刻意不导出 ——
 * 它们依赖布局上下文才能正常工作，单独使用只会得到一个没有状态的空壳。
 *
 * @path comm\@core\ui-kit\layout-ui\src\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export type * from './YDSZ-layout';
export { default as YDSZAdminLayout } from './YDSZ-layout.vue';
