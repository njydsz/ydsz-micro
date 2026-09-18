/**
 * @file use-debounced-search.test.ts
 * @description useDebouncedSearch composable 测试——防抖 / minLength / reset / cancel。
 *
 * @path comm\@core\ui-kit\ydsz-vue\src\composables\__tests__\use-debounced-search.test.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useDebouncedSearch } from '../use-debounced-search'

interface DummyOption {
  label: string
  value: string
}

function createFetcher() {
  return vi.fn(async (query: string): Promise<DummyOption[]> => {
    return [
      { label: `${query}-a`, value: `${query}-1` },
      { label: `${query}-b`, value: `${query}-2` },
    ]
  })
}

describe('useDebouncedSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('初始状态为空', () => {
    const fetcher = createFetcher()
    const { query, results, isLoading, error } = useDebouncedSearch<DummyOption>(fetcher)
    expect(query.value).toBe('')
    expect(results.value).toEqual([])
    expect(isLoading.value).toBe(false)
    expect(error.value).toBeNull()
  })

  it('debounce 时间后才触发搜索', async () => {
    const fetcher = createFetcher()
    const { query } = useDebouncedSearch<DummyOption>(fetcher, { debounceMs: 200 })
    query.value = 'hello'
    expect(fetcher).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(200)
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(fetcher).toHaveBeenCalledWith('hello')
  })

  it('短输入（< minLength）不触发搜索', async () => {
    const fetcher = createFetcher()
    const { query } = useDebouncedSearch<DummyOption>(fetcher, { minLength: 2 })
    query.value = 'a'
    await vi.advanceTimersByTimeAsync(500)
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('快速修改 query：防抖只触发一次（取消上一次）', async () => {
    const fetcher = createFetcher()
    const { query } = useDebouncedSearch<DummyOption>(fetcher, { debounceMs: 100 })
    query.value = 'a'
    query.value = 'ab'
    query.value = 'abc'
    await vi.advanceTimersByTimeAsync(50)
    expect(fetcher).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(100)
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(fetcher).toHaveBeenCalledWith('abc')
  })

  it('reset 清空所有状态', async () => {
    const fetcher = createFetcher()
    const { query, results, reset } = useDebouncedSearch<DummyOption>(fetcher)
    query.value = 'test'
    await vi.advanceTimersByTimeAsync(500)
    expect(fetcher).toHaveBeenCalledTimes(1)
    reset()
    expect(query.value).toBe('')
    expect(results.value).toEqual([])
  })

  it('search() 手动立即触发（忽略防抖）', () => {
    const fetcher = createFetcher()
    const { query, search } = useDebouncedSearch<DummyOption>(fetcher, { debounceMs: 500 })
    query.value = 'instant'
    search()
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(fetcher).toHaveBeenCalledWith('instant')
  })

  it('trim 查询：纯空格 query 视为空字符串', async () => {
    const fetcher = createFetcher()
    const { query } = useDebouncedSearch<DummyOption>(fetcher, { minLength: 1 })
    query.value = '   '
    await vi.advanceTimersByTimeAsync(500)
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('query 变化后新搜索开始前取消旧 setTimeout', async () => {
    const fetcher = createFetcher()
    const { query } = useDebouncedSearch<DummyOption>(fetcher, { debounceMs: 200 })
    query.value = 'first'
    await vi.advanceTimersByTimeAsync(100)
    // query 变化 → 防抖重置
    query.value = 'second'
    // 再推进 100ms（总共 200ms，但第二个 timer 才过了 100ms）
    await vi.advanceTimersByTimeAsync(100)
    expect(fetcher).not.toHaveBeenCalled()
    // 再推进 100ms → 第二个 timer 到达 200ms
    await vi.advanceTimersByTimeAsync(100)
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(fetcher).toHaveBeenCalledWith('second')
  })
})
