/**
 * 面包屑的出口。
 *
 * 两套用法并存：
 * - YdBreadcrumbView / ydBreadcrumb —— 数据驱动（breadcrumbs 数组 + 末级下拉）；
 * - YdBreadcrumb 七件套 —— 声明式原子组件，配合 YdBreadcrumbPro 可用 items 配置快速声明。
 *
 * 类型契约统一取自 ./types；原 breadcrumb-types.ts 里的同名 BreadcrumbProps
 * 与骨架占位实现一并下线，避免包根出现重名导出。
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
export { default as YdBreadcrumbPro } from './YdBreadcrumbPro.vue';
export { default as YdBreadcrumbSeparator } from './YdBreadcrumbSeparator.vue';
export { default as ydBreadcrumb } from './breadcrumb.vue';

export type { BreadcrumbItemOption } from './YdBreadcrumbPro.vue';
