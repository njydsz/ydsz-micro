/**
 * 搜索 Pinia Store —— 管理查询状态、搜索结果与搜索历史
 *
 * @path main\src\store\search.ts
 * @author ydsz-team
 * @since 5.1.0
 *
 * - 使用 pinia-plugin-persistedstate 的 paths 持久化搜索历史（最近 20 条）
 * - 维护查询状态 loading / results
 * - 操作：doSearch / clearResults / clearHistory / removeHistoryItem
 */
import { ref } from 'vue';

import { defineStore } from 'pinia';

import { createLogger } from '@ydsz-core/shared/utils';

import {
  searchAll,
  type SearchCategory,
  type SearchResult,
  type SearchResultItem,
} from '#/api/search';

/** 模块级日志器 */
const logger = createLogger('SearchStore');

/** 历史搜索最大条数 */
const MAX_HISTORY_ITEMS = 20;

/**
 * 全局搜索 Store —— 命令面板 / 全局搜索挂件共享
 */
export const useSearchStore = defineStore('search', () => {
  // ==================== State ====================

  /** 是否正在搜索 */
  const loading = ref(false);

  /** 当前搜索结果 */
  const results = ref<SearchResultItem[]>([]);

  /** 搜索历史（最近 20 条） */
  const recentSearches = ref<string[]>([]);

  /** 当前搜索词 */
  const currentQuery = ref('');

  /** 用于取消上一次未完成的请求 */
  let abortController: AbortController | null = null;

  // ==================== Actions ====================

  /**
   * 执行跨类别全文搜索。
   *
   * 每次调用前自动取消上一次未完成请求（AbortController），
   * 搜索完成后自动写入搜索历史。
   *
   * @param query - 搜索词
   * @param categories - 类别过滤（可选，默认全部）
   * @returns 聚合搜索结果
   *
   * @since 5.1.0
   */
  async function doSearch(
    query: string,
    categories?: SearchCategory[],
  ): Promise<SearchResult | null> {
    const trimmed = query.trim();

    if (!trimmed) {
      results.value = [];
      currentQuery.value = '';
      return null;
    }

    // 取消上一轮请求
    abortController?.abort();
    abortController = new AbortController();

    loading.value = true;
    currentQuery.value = trimmed;

    try {
      const resp = await searchAll(
        { query: trimmed, categories },
        abortController,
      );
      results.value = resp.items;
      // 写入历史
      addHistoryEntry(trimmed);
      return resp;
    } catch (err) {
      // 取消时不视为错误
      if (err instanceof DOMException && err.name === 'AbortError') {
        logger.debug('搜索请求已取消:', trimmed);
        return null;
      }
      logger.warn('搜索失败:', err);
      results.value = [];
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 清空搜索结果（关闭面板时调用）。
   *
   * @since 5.1.0
   */
  function clearResults(): void {
    results.value = [];
    currentQuery.value = '';
    abortController?.abort();
    abortController = null;
  }

  /**
   * 清空全部搜索历史。
   *
   * @since 5.1.0
   */
  function clearHistory(): void {
    recentSearches.value = [];
  }

  /**
   * 移除单条搜索历史。
   *
   * @param index - 要移除的索引
   *
   * @since 5.1.0
   */
  function removeHistoryItem(index: number): void {
    if (index >= 0 && index < recentSearches.value.length) {
      recentSearches.value.splice(index, 1);
    }
  }

  // ==================== Internals ====================

  /**
   * 写入搜索历史（去重 + 置顶 + 截断）。
   */
  function addHistoryEntry(query: string): void {
    const idx = recentSearches.value.indexOf(query);
    if (idx !== -1) {
      recentSearches.value.splice(idx, 1);
    }
    recentSearches.value.unshift(query);
    // 截断至最大条数
    if (recentSearches.value.length > MAX_HISTORY_ITEMS) {
      recentSearches.value = recentSearches.value.slice(0, MAX_HISTORY_ITEMS);
    }
  }

  // ==================== Return ====================

  return {
    // state
    loading,
    results,
    recentSearches,
    currentQuery,
    // actions
    doSearch,
    clearResults,
    clearHistory,
    removeHistoryItem,
  };
}, {
  /** 持久化搜索历史（最近 20 条）到 localStorage */
  persist: {
    paths: ['recentSearches'],
  },
});
