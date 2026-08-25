/**
 * use-server-pagination 组合式函数 — 服务端分页
 *
 * @path comm\effects\shared-business\src\composables\use-server-pagination.ts
 * @author ydsz-team
 * @since 1.1.0
 *
 * @remarks
 * 管理服务端分页状态（pageNum/pageSize/total），提供查询参数合并。
 * 相比 @ydsz/hooks 的 usePagination（仅前端切片），本 Hook 面向服务端分页场景。
 */
import { computed, reactive, ref, unref, type Ref } from 'vue';

/**
 * 分页查询函数类型
 *
 * @typeParam T - 数据项类型
 * @typeParam Q - 查询参数类型
 * @param query - 合并了分页字段的完整查询参数
 * @returns 数据项列表与总条数
 *
 * @example
 * ```ts
 * const fetcher: ServerPaginationFetcher<Item, { keyword: string }> = async (query) => {
 *   const res = await fetchList({ keyword: query.keyword, page: query.pageNum, size: query.pageSize });
 *   return { items: res.list, total: res.total };
 * };
 * ```
 */
export type ServerPaginationFetcher<T = unknown, Q = Record<string, unknown>> = (
  query: Q & { pageNum: number; pageSize: number },
) => Promise<{ items: T[]; total: number }>;

/**
 * 服务端分页配置项
 *
 * @since 1.1.0
 */
export interface ServerPaginationOptions {
  /** 初始页码，默认 1 */
  pageNum?: number;
  /** 初始每页条数，默认 10 */
  pageSize?: number;
  /** 是否首次自动加载，默认 true */
  immediate?: boolean;
}

/** 响应式查询参数（不含分页字段） */
type QueryParams<Q> = Ref<Q> | Record<string, unknown>;

/**
 * 服务端分页 Hook — 管理服务端分页状态与查询
 *
 * 封装 pageNum / pageSize / total / items / loading 等响应式状态，
 * 提供 search / changePage / changePageSize / reset 等操作方法。
 *
 * @typeParam T - 数据项类型
 * @typeParam Q - 查询参数类型
 * @param fetcher - 分页查询函数，接收合并了分页字段的查询参数
 * @param params - 额外查询参数（ref 或响应式对象），默认空对象
 * @param options - 分页配置项
 * @returns 分页状态与操作方法的集合
 * @returns items - 当前页数据列表（Ref）
 * @returns total - 总条数（Ref）
 * @returns loading - 加载中状态（Ref）
 * @returns pageNum - 当前页码（Ref）
 * @returns pageSize - 每页条数（Ref）
 * @returns pagination - 分页组件用的聚合对象（Computed）
 * @returns fetchData - 执行查询的函数
 * @returns search - 重置到第一页并查询
 * @returns changePage - 切换页码并查询
 * @returns changePageSize - 切换每页条数并查询（重置到第一页）
 * @returns reset - 重置分页状态到初始值
 *
 * @example
 * ```ts
 * const query = reactive({ keyword: '' });
 * const { items, total, loading, pagination, fetchData, search } =
 *   useServerPagination(getListApi, query);
 *
 * // 搜索场景：重置页码并查询
 * watch(searchKeyword, () => search());
 * ```
 *
 * @since 1.1.0
 */
export function useServerPagination<T = unknown, Q = Record<string, unknown>>(
  fetcher: ServerPaginationFetcher<T, Q>,
  params: QueryParams<Q> = {} as Q,
  options: ServerPaginationOptions = {},
) {
  const { pageNum: initPageNum = 1, pageSize: initPageSize = 10, immediate = true } = options;

  const pageNum = ref(initPageNum);
  const pageSize = ref(initPageSize);
  const total = ref(0);
  const items = ref<T[]>([]) as Ref<T[]>;
  const loading = ref(false);

  /** 合并后的查询参数（含分页字段） */
  const mergedQuery = computed(() => {
    const base = unref(params) || {};
    return {
      ...(base as object),
      pageNum: pageNum.value,
      pageSize: pageSize.value,
    } as Q & { pageNum: number; pageSize: number };
  });

  /** 分页组件用的聚合对象 */
  const pagination = computed(() => ({
    current: pageNum.value,
    pageSize: pageSize.value,
    total: total.value,
  }));

  async function fetchData() {
    loading.value = true;
    try {
      const result = await fetcher(mergedQuery.value);
      items.value = result.items;
      total.value = result.total;
      return result;
    } finally {
      loading.value = false;
    }
  }

  /** 重置到第一页并查询（搜索场景） */
  function search() {
    pageNum.value = 1;
    return fetchData();
  }

  function changePage(page: number) {
    pageNum.value = page;
    return fetchData();
  }

  function changePageSize(size: number) {
    pageSize.value = size;
    pageNum.value = 1;
    return fetchData();
  }

  /** 重置分页状态 */
  function reset() {
    pageNum.value = initPageNum;
    pageSize.value = initPageSize;
    total.value = 0;
    items.value = [] as T[];
  }

  if (immediate) {
    void fetchData();
  }

  return {
    changePage,
    changePageSize,
    fetchData,
    items,
    loading,
    pageNum,
    pageSize,
    pagination,
    reset,
    search,
    total,
  };
}
