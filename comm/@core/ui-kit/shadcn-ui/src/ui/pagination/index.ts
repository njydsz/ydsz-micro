/**
 * 分页器按钮组的出口：首页 / 上一页 / 下一页 / 末页 / 省略号。
 *
 * 只提供导航按钮与省略号，页码本身由调用方渲染 ——
 * 页码数量与是否折叠属于业务策略，组件不应替调用方决定。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\pagination\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as PaginationEllipsis } from './PaginationEllipsis.vue';
export { default as PaginationFirst } from './PaginationFirst.vue';
export { default as PaginationLast } from './PaginationLast.vue';
export { default as PaginationNext } from './PaginationNext.vue';
export { default as PaginationPrev } from './PaginationPrev.vue';
export {
  PaginationRoot as Pagination,
  PaginationList,
  PaginationListItem,
} from 'radix-vue';
