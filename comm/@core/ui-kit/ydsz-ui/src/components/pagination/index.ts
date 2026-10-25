export { default as YdPagination } from './YdPagination.vue';
export { default as YdPaginationEllipsis } from './YdPaginationEllipsis.vue';
export { default as YdPaginationFirst } from './YdPaginationFirst.vue';
export { default as YdPaginationLast } from './YdPaginationLast.vue';
export { default as YdPaginationNext } from './YdPaginationNext.vue';
export { default as YdPaginationPrev } from './YdPaginationPrev.vue';

// 兼容 shadcn 风格的分页复合组件引用（消费方按 Root/List/ListItem 自行组装）
export {
  PaginationRoot as Pagination,
  PaginationList,
  PaginationListItem,
} from '@ydsz-core/ydsz-vue';

// merged from pre-refactor ui/ + primitives/ barrels
export { default as ydPagination } from './pagination.vue';
export type { PaginationProps } from './pagination-types';
