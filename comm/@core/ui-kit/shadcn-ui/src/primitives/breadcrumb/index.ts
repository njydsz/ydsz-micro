/**
 * 面包屑七件套的出口：容器、列表、条目、链接、当前页、分隔符与省略号。
 *
 * 拆分粒度较细，是因为每一级的可点击性不同（链接或纯文本），
 * 只有拆开才能在保持 ol / li / aria-current 语义的同时自由组合。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\breadcrumb\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as YdBreadcrumb } from './YdBreadcrumb.vue';
export { default as YdBreadcrumbEllipsis } from './YdBreadcrumbEllipsis.vue';
export { default as YdBreadcrumbItem } from './YdBreadcrumbItem.vue';
export { default as YdBreadcrumbLink } from './YdBreadcrumbLink.vue';
export { default as YdBreadcrumbList } from './YdBreadcrumbList.vue';
export { default as YdBreadcrumbPage } from './YdBreadcrumbPage.vue';
export { default as YdBreadcrumbSeparator } from './YdBreadcrumbSeparator.vue';
