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
export { default as Breadcrumb } from './Breadcrumb.vue';
export { default as BreadcrumbEllipsis } from './BreadcrumbEllipsis.vue';
export { default as BreadcrumbItem } from './BreadcrumbItem.vue';
export { default as BreadcrumbLink } from './BreadcrumbLink.vue';
export { default as BreadcrumbList } from './BreadcrumbList.vue';
export { default as BreadcrumbPage } from './BreadcrumbPage.vue';
export { default as BreadcrumbSeparator } from './BreadcrumbSeparator.vue';
