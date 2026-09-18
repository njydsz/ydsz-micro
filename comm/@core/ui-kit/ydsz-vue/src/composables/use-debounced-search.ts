/**
 * @file use-debounced-search.ts
 * @description 异步搜索 composable —— ydsz-vue 业务特化层。
 *
 * 为 AutoComplete / TreeSelect / Mention 等组件通用的"输入防抖 + 异步查询"场景
 * 提供可复用的状态机。上游 headless 层不提供此类业务感知 API。
 *
 * @path comm\@core\ui-kit\ydsz-vue\src\composables\use-debounced-search.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import type { Ref } from 'vue'

import { ref, watch } from 'vue'

/** useDebouncedSearch 配置项 */
export interface UseDebouncedSearchOptions {
  /** 防抖等待时间（ms），默认 300 */
  debounceMs?: number
  /** 触发搜索的最小输入长度，默认 1（空字符串不搜索） */
  minLength?: number
}

/** useDebouncedSearch 返回句柄 */
export interface UseDebouncedSearchHandle<T> {
  /** 当前查询字符串（输入框直接绑定） */
  query: Ref<string>
  /** 搜索结果 */
  results: Ref<T[]>
  /** 请求进行中 */
  isLoading: Ref<boolean>
  /** 错误信息 */
  error: Ref<Error | null>
  /** 手动触发一次搜索（忽略防抖） */
  search: () => void
  /** 清空结果和查询 */
  reset: () => void
}

/**
 * 带防抖的异步搜索状态机。
 *
 * 手动防抖实现（不依赖 @vueuse/core useDebounceFn，
 * 因其在 workspace 锁定的 13.x 中返回纯函数无 cancel/flush）。
 *
 * @param fetcher   异步查询函数（query → results）
 * @param options   防抖 / 最小长度配置
 *
 * @example
 * ```ts
 * const { query, results, isLoading } = useDebouncedSearch<DictOpt>(
 *   (q) => fetchDictOptions(q),
 *   { debounceMs: 300, minLength: 1 },
 * )
 * ```
 */
export function useDebouncedSearch<T>(
  fetcher: (query: string) => Promise<T[]>,
  options: UseDebouncedSearchOptions = {},
): UseDebouncedSearchHandle<T> {
  const {
    debounceMs = 300,
    minLength = 1,
  } = options

  const query = ref('')
  const results = ref<T[]>([]) as Ref<T[]>
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let abortController: AbortController | null = null

  /** 执行实际查询 */
  async function executeSearch(): Promise<void> {
    const trimmedQuery = query.value.trim()

    if (trimmedQuery.length < minLength) {
      results.value = []
      isLoading.value = false
      return
    }

    // 取消上一次未完成请求
    abortController?.abort()
    abortController = new AbortController()

    isLoading.value = true
    error.value = null

    try {
      const data = await fetcher(trimmedQuery)
      results.value = data
    }
    catch (err) {
      if ((err as Error).name !== 'AbortError') {
        error.value = err as Error
        results.value = []
      }
    }
    finally {
      isLoading.value = false
    }
  }

  /** 防抖调用入口 */
  function debouncedSearch(): void {
    disposeTimer()
    debounceTimer = setTimeout(() => {
      void executeSearch()
    }, debounceMs)
  }

  /** 立即执行（取消防抖） */
  function search(): void {
    disposeTimer()
    void executeSearch()
  }

  function reset(): void {
    query.value = ''
    results.value = []
    isLoading.value = false
    error.value = null
    disposeTimer()
  }

  /** 清理防抖计时器 */
  function disposeTimer(): void {
    if (debounceTimer !== null) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
  }

  /** query 变化 -> 防抖搜索 */
  watch(query, () => {
    void debouncedSearch()
  })

  return {
    query,
    results,
    isLoading,
    error,
    search,
    reset,
  }
}
