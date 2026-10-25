/**
 * 面包屑的出口：导出 YdBreadcrumbView 及其 props 类型。
 *
 * 只导出视图组件而不导出内部两个形态变体，后续调整样式分支时不影响消费方。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\breadcrumb\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as YdBreadcrumbView } from './YdBreadcrumbView.vue';

export type * from './types';

// merged from pre-refactor ui/ + primitives/ barrels
export { default as YdBreadcrumb } from './YdBreadcrumb.vue';
export { default as YdBreadcrumbEllipsis } from './YdBreadcrumbEllipsis.vue';
export { default as YdBreadcrumbItem } from './YdBreadcrumbItem.vue';
export { default as YdBreadcrumbLink } from './YdBreadcrumbLink.vue';
export { default as YdBreadcrumbList } from './YdBreadcrumbList.vue';
export { default as YdBreadcrumbPage } from './YdBreadcrumbPage.vue';
export { default as YdBreadcrumbSeparator } from './YdBreadcrumbSeparator.vue';
export { default as ydBreadcrumb } from './breadcrumb.vue';
export type { BreadcrumbProps } from './breadcrumb-types';
