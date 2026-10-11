/**
 * AutoComplete 状态控制器。
 *
 * <p>封装输入 / 防抖搜索 / 缓存 / 键盘导航 / loading 等组合能力。
 *
 * <p>该 composable 是一个无头层 —— 不依赖任何 UI 状态机本身，
 * 派发 computed（suggestions / loading / highlighting 等）供上层 ui 组件消费。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\auto-complete\use-auto-complete.ts
 * @author ydsz-team
 * @since 26.10.11
 */

import type { Ref } from 'vue';

import { ref, watch } from 'vue';

import type { AutoCompleteFetchMethod, AutoCompleteOption } from './auto-complete-types';

export interface UseAutoCompleteOptions<T = unknown> {
  /** 用户输入的关键词（外部双向绑定） */
  query: Ref<string>;
  /** 远端数据源获取函数 */
  fetchMethod?: AutoCompleteFetchMethod<T>;
  /** 延迟（毫秒），默认 300 */
  debounceMs?: number;
  /** 最少输入字符数才发起搜索，默认 1 */
  minLength?: number;
  /** 是否启用缓存，默认 true */
  cacheEnabled?: boolean;
  /** 缓存过期时间（毫秒），默认 5 分钟 */
  cacheTTL?: number;
}

export interface UseAutoCompleteReturn<T = unknown> {
  /** 当前搜索结果的响应式引用 */
  suggestions: Ref<AutoCompleteOption<T>[]>;
  /** 是否正在加载中 */
  isLoading: Ref<boolean>;
  /** 是否有错误 */
  error: Ref<unknown>;
  /** 是否展示下拉面板（输入长度足够且未禁用） */
  showDropdown: Ref<boolean>;
  /** 键盘导航当前高亮索引 */
  activeIndex: Ref<number>;
  /** 触发搜索（内部已防抖） */
  triggerSearch: (keyword: string) => void;
  /** 搜索完成由父组件喂入结果（绕过内部 fetchMethod） */
  setSuggestions: (options: AutoCompleteOption<T>[]) => void;
  /** 键盘导航事件处理器 */
  handleKeydown: (event: KeyboardEvent) => void;
  /** 选择指定候选 */
  selectOption: (option: AutoCompleteOption<T>) => void;
  /** 清空所有状态 */
  reset: () => void;
}

/**
 * 简单的内存缓存。
 *
 * @returns 缓存对象
 */
function createMemoryCache<T>() {
  const map = new Map<string, { data: AutoCompleteOption<T>[]; expireAt: number }>();
  return {
    get(key: string): AutoCompleteOption<T>[] | null {
      const entry = map.get(key);
      if (!entry) {
        return null;
      }
      if (Date.now() > entry.expireAt) {
        map.delete(key);
        return null;
      }
      return entry.data;
    },
    set(key: string, data: AutoCompleteOption<T>[], ttl: number): void {
      map.set(key, { data, expireAt: Date.now() + ttl });
    },
    clear(): void {
      map.clear();
    },
  };
}

/** 防抖函数工厂 */
function createDebouncer(delay: number): { run: (fn: () => void) => void; cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    run(fn: () => void): void {
      if (timer !== undefined) {
        clearTimeout(timer);
      }
      timer = setTimeout(fn, delay);
    },
    cancel(): void {
      if (timer !== undefined) {
        clearTimeout(timer);
        timer = undefined;
      }
    },
  };
}

/**
 * AutoComplete 无头控制器。
 *
 * @param options 配置项
 * @returns 控制器句柄
 */
export function useAutoComplete<T = unknown>(
  options: UseAutoCompleteOptions<T>,
): UseAutoCompleteReturn<T> {
  const {
    query,
    fetchMethod,
    debounceMs = 300,
    minLength = 1,
    cacheEnabled = true,
    cacheTTL = 5 * 60 * 1000,
  } = options;

  const suggestions = ref<AutoCompleteOption<T>[]>([]) as Ref<AutoCompleteOption<T>[]>;
  const isLoading = ref(false);
  const error = ref<unknown>(undefined);
  const activeIndex = ref(-1);
  const showDropdown = ref(false);

  const cache = createMemoryCache<T>();
  const debouncer = createDebouncer(debounceMs);

  /**
   * 执行实际的数据请求。
   *
   * 单次搜索会先检查缓存：命中则直接喂入结果未命中则调用 fetchMethod 请求远端。
   *
   * @param keyword - 搜索关键字
   */
  async function doFetch(keyword: string): Promise<void> {
    const trimKeyword = keyword.trim();

    // 命中缓存
    if (cacheEnabled) {
      const cached = cache.get(trimKeyword);
      if (cached) {
        suggestions.value = cached;
        isLoading.value = false;
        error.value = undefined;
        showDropdown.value = cached.length > 0 || trimKeyword.length >= minLength;
        return;
      }
    }

    if (!fetchMethod) {
      suggestions.value = [];
      return;
    }

    isLoading.value = true;
    error.value = undefined;
    try {
      const result = await fetchMethod(trimKeyword);
      suggestions.value = result ?? [];
      if (cacheEnabled && trimKeyword) {
        cache.set(trimKeyword, suggestions.value, cacheTTL);
      }
    } catch (e) {
      error.value = e;
      suggestions.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 触发搜索（带防抖）。
   *
   * 输入不足 minLength 字符时直接清空结果、关闭下拉；
   * 否则启动防抖定时器异步请求远端。
   *
   * @param keyword - 搜索关键字
   */
  function triggerSearch(keyword: string): void {
    activeIndex.value = -1;
    const trim = keyword.trim();
    if (trim.length < minLength) {
      suggestions.value = [];
      showDropdown.value = false;
      isLoading.value = false;
      return;
    }
    showDropdown.value = true;
    debouncer.run(() => {
      doFetch(trim).catch(() => {
        // 错误已在 doFetch 中被捕获
      });
    });
  }

  /**
   * 外部直接喂入搜索结果（覆盖内部 fetchMethod 路径）。
   *
   * 典型场景：下拉树（TreeSelect）在上游选好整个树后由本方法注入数据。
   *
   * @param opts - 候选项数组
   */
  function setSuggestions(opts: AutoCompleteOption<T>[]): void {
    suggestions.value = opts;
    isLoading.value = false;
    showDropdown.value = opts.length > 0;
  }

  /**
   * 键盘导航。
   *
   * - ArrowDown：向下移动高亮
   * - ArrowUp：向上移动高亮
   * - Enter：选中高亮项
   * - Escape：关闭下拉
   *
   * @param event - 原始 KeyboardEvent
   * @param callbacks - 关闭下拉的回调（避免耦合 emit）
   */
  function handleKeydown(
    event: KeyboardEvent,
    callbacks?: { select: (index: number) => void; close: () => void },
  ): void {
    const total = suggestions.value.length;
    if (total === 0) {
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      activeIndex.value = activeIndex.value >= total - 1 ? 0 : activeIndex.value + 1;
      showDropdown.value = true;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      activeIndex.value = activeIndex.value <= 0 ? total - 1 : activeIndex.value - 1;
    } else if (event.key === 'Enter') {
      if (activeIndex.value >= 0 && activeIndex.value < total) {
        event.preventDefault();
        callbacks?.select(activeIndex.value);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      callbacks?.close();
    }
  }

  /**
   * 选择指定候选项。
   *
   * @param option - 被选的候选项
   */
  function selectOption(_option: AutoCompleteOption<T>): void {
    // 由父组件通过 emit 处理选择逻辑；本函数重置导航状态。
    activeIndex.value = -1;
    showDropdown.value = false;
  }

  function reset(): void {
    suggestions.value = [];
    isLoading.value = false;
    error.value = undefined;
    activeIndex.value = -1;
    showDropdown.value = false;
    cache.clear();
    debouncer.cancel();
  }

  // 监听外部 query 触发搜索
  watch(
    () => query.value,
    (val) => {
      if (val !== undefined) {
        triggerSearch(val);
      }
    },
  );

  return {
    suggestions,
    isLoading,
    error,
    showDropdown,
    activeIndex,
    triggerSearch,
    setSuggestions,
    handleKeydown,
    selectOption,
    reset,
  };
}

export { useAutoComplete as default };
