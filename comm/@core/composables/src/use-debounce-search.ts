/**
 * 搜索防抖组合式函数。
 *
 * 用于搜索输入框等高频触发场景，避免每次输入都发起请求。
 * 基于 VueUse 的 useDebounceFn 封装，提供统一的防抖配置。
 *
 * @path comm\@core\composables\src\use-debounce-search.ts
 * @author ydsz-team
 * @since 1.0.0
 *
 * @example
 * ```ts
 * const { debouncedSearch, isSearching } = useDebounceSearch(300, 3);
 *
 * function onInput(keyword: string) {
 *   debouncedSearch(keyword);
 * }
 * ```
 */
import { ref } from 'vue';

import { useDebounceFn } from '@vueuse/core';

/**
 * 搜索防抖配置。
 */
export interface DebounceSearchOptions {
  /**
   * 防抖延迟（毫秒），默认 300ms。
   */
  delay?: number;

  /**
   * 最小触发长度，默认 3 字符。
   * 输入长度小于该值时不触发搜索。
   */
  minLength?: number;
}

/**
 * 搜索防抖组合式函数。
 *
 * @param options - 防抖配置
 * @returns debouncedSearch（防抖后的搜索函数）、isSearching（是否正在防抖等待）
 */
export function useDebounceSearch(options: DebounceSearchOptions = {}) {
  const { delay = 300, minLength = 3 } = options;

  const isSearching = ref(false);

  const debouncedSearch = useDebounceFn((keyword: string) => {
    if (keyword.length < minLength) {
      return;
    }
    isSearching.value = true;
    // 搜索完成后重置状态（由调用方在请求回调中调用 resetSearching）
  }, delay);

  function resetSearching() {
    isSearching.value = false;
  }

  return {
    debouncedSearch,
    isSearching,
    resetSearching,
  };
}
