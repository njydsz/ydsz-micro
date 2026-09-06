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
 *
 * <p>P1-1（2026-09-06）：引入 AbortController 机制消除快速翻页时的竞态问题 ——
 * 先发的后响应不再覆盖后发的先响应。当 fetcher 支持 AbortSignal 时（如 fetch API），
 * 旧请求会被主动中止；不支持时退化为序列号（requestSeq）校验，
 * 仅最新一次请求会更新 items / total。
 */
import { computed, ref, unref, type Ref } from 'vue';

/**
 * 分页查询函数类型
 *
 * @typeParam T - 数据项类型
 * @typeParam Q - 查询参数类型
 * @param query - 合并了分页字段的完整查询参数
 * @param signal - 中止信号；fetcher 可将此 signal 透传给底层请求（如 fetch），
 *                 当发起新请求时旧请求会被主动中止，避免响应竞态。
 *                 对于不支持 AbortSignal 的请求库，该参数可Hook 内部会退化为序列号校验。
 * @returns 数据项列表与总条数
 *
 * @example
 * ```ts
 * const fetcher: ServerPaginationFetcher<Item, { keyword: string }> = async (query, signal) => {
 *   const res = await fetchList({ keyword: query.keyword, page: query.pageNum, size: query.pageSize, signal });
 *   return { items: res.list, total: res.total };
 * };
 * ```
 *
 * @since 1.1.0
 */
export type ServerPaginationFetcher<T = unknown, Q = Record<string, unknown>> = (
  query: Q & { pageNum: number; pageSize: number },
  signal?: AbortSignal,
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
  /**
   * 是否启用请求中止机制。
   *
   * <p>启用后，每次发起新请求前会中止上一未完成请求（通过 AbortController），
   * 并使 fetcher 收到 AbortSignal 以便透传给底层 fetch。对于不支持
   * AbortSignal 的 fetcher，退化为序列号校验模式，仅最后一次请求更新状态。
   *
   * @default true
   * @since 1.2.0
   */
  enableAbort?: boolean;
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
  const { pageNum: initPageNum = 1, pageSize: initPageSize = 10, immediate = true, enableAbort = true } = options;

  const pageNum = ref(initPageNum);
  const pageSize = ref(initPageSize);
  const total = ref(0);
  const items = ref<T[]>([]) as Ref<T[]>;
  const loading = ref(false);

  /**
   * 当前 AbortController；启用中止模式时用于主动中止上一未完成请求。
   *
   * <p>每次 fetchData 调用前会 abort 上一 controller（如有），并创建新的。
   */
  let abortController: AbortController | null = null;

  /**
   * 请求序列号（递增），用于 fetcher 不支持 AbortSignal 时的竞态兜底。
   *
   * <p>每次 fetchData 进入时自增，响应返回时仅当 seq 与当前值匹配才写入状态。
   */
  let requestSeq = 0;

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

  /**
   * 执行服务端分页查询。
   *
   * <p>竞态保护机制：
   * <ol>
   *   <li>启用 AbortController 时：中止上一未完成请求，为新请求创建 Controller 并传入 signal</li>
   *   <li>不支持 AbortSignal 时（或 enableAbort=false）：通过序列号匹配仅应用最新一次响应</li>
   * </ol>
   */
  async function fetchData() {
    loading.value = true;

    // 中止上一未完成请求
    if (enableAbort && abortController) {
      abortController.abort();
      abortController = null;
    }

    // 创建新 Controller（仅启用中止模式且环境支持 AbortController 时）
    if (enableAbort && typeof AbortController !== 'undefined') {
      abortController = new AbortController();
    }

    // 记录本次请求序列号
    const currentSeq = ++requestSeq;
    const signal = abortController?.signal;

    try {
      const result = await fetcher(mergedQuery.value, signal);

      // 序列号校验：仅最新一次请求更新状态，避免旧响应覆盖新响应
      if (currentSeq !== requestSeq) return result;

      items.value = result.items;
      total.value = result.total;
      return result;
    } catch (error) {
      // 序列号校验：已被中止的旧请求不抛出
      if (currentSeq !== requestSeq) return { items: [] as T[], total: 0 };
      throw error;
    } finally {
      loading.value = false;
      // 清理已完成的 Controller
      if (abortController?.signal === signal) {
        abortController = null;
      }
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
