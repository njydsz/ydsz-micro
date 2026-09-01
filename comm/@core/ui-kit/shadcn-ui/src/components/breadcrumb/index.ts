/**
 * 面包屑的出口：导出 YDSZBreadcrumbView 及其 props 类型。
 *
 * 只导出视图组件而不导出内部两个形态变体，后续调整样式分支时不影响消费方。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\components\breadcrumb\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as YDSZBreadcrumbView } from './breadcrumb-view.vue';

export type * from './types';

