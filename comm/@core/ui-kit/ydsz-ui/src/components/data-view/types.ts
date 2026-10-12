/**
 * DataView（数据视图）Props / Emits。
 *
 * <p>通用数据展示容器：支持 list / grid 布局、分页、header/footer 插槽。
 * 单条数据通过默认插槽（prop: item）渲染，支持 v-model:page / v-model:pageSize。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\data-view\types.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/* ============================================================ */
/* Props                                                          */
/* ============================================================ */

/** DataView 布局模式 */
export type DataViewLayout = 'list' | 'grid';

/** YdDataView 组件 Props */
export interface YdDataViewProps<T extends Record<string, unknown>> {
  /** 数据源 */
  data: T[];
  /** 布局模式：list（单行）/ grid（卡片网格），默认 'list' */
  layout?: DataViewLayout;
  /** 每页条数，默认 10 */
  pageSize?: number;
  /** 是否分页，默认 true */
  paginated?: boolean;
}

/* ============================================================ */
/* Emits                                                          */
/* ============================================================ */

/** YdDataView 组件 Emits */
export interface YdDataViewEmits {
  /** 当前页变化（v-model:page） */
  (e: 'update:page', page: number): void;
  /** 每页条数变化（v-model:pageSize） */
  (e: 'update:pageSize', pageSize: number): void;
  /** 分页变化（页码或每页条数变化时触发） */
  (e: 'page-change', page: number, pageSize: number): void;
}

/* ============================================================ */
/* Slots                                                          */
/* ============================================================ */

/** YdDataView 组件 Slots */
export interface YdDataViewSlots<T extends Record<string, unknown>> {
  /** 单条数据渲染插槽 */
  item: { item: T; index: number };
  /** 头部插槽 */
  header: never;
  /** 底部插槽 */
  footer: never;
  /** 分页插槽（可覆盖默认分页组件） */
  pagination: { page: number; pageSize: number; total: number };
}

/* ============================================================ */
/* 内部工具                                                        */
/* ============================================================ */

/** Pagination 分页信息 */
export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
