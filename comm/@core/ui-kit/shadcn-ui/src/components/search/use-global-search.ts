/**
 * 全局搜索 composable —— 管理搜索状态、触发搜索、维护历史与建议。
 *
 * <p>与 Vue 组件解耦（不依赖组件生命周期），可在路由守卫、指令等非组件场景复用。
 *
 * <p>使用示例：
 * <pre>
 * const {
 *   keyword, loading, results, suggestions,
 *   executeSearch, selectSuggestion, clearSearch,
 * } = useGlobalSearch();
 * </pre>
 *
 * @path comm/@core/ui-kit/shadcn-ui/src/components/search/use-global-search.ts
 * @author ydsz-team
 * @since 4.1.0 (P2-13)
 */

import type { GlobalSearchResponse, SearchHit, SearchSuggestion } from './search-types';

import { computed, ref, watch } from 'vue';

import { useDebounceFn } from '@vueuse/core';

import { systemClient } from '@ydsz/system-api';

/** 搜索接口路径 */
const SEARCH_API = '/api/v1/search/unified';
const SUGGEST_API = '/api/v1/search/suggest';

/** 搜索历史 localStorage key */
const HISTORY_KEY = 'global-search-history';
const MAX_HISTORY = 10;

/** 搜索关键词 */
const keyword = ref('');

/** 搜索加载态 */
const loading = ref(false);

/** 搜索结果（null 表示未搜索 / 已清空） */
const results = ref<GlobalSearchResponse | null>(null);

/** 搜索建议列表 */
const suggestions = ref<SearchSuggestion[]>([]);

/** 当前选中的模块 tab（默认 '_all' 显示全部） */
const activeTab = ref<string>('_all');

// =====================================================================
// 搜索历史（localStorage 持久化）
// =====================================================================

/** 读取搜索历史 */
function getSearchHistory(): SearchSuggestion[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SearchSuggestion[];
  } catch {
    return [];
  }
}

/** 写入搜索历史（去重 + 截断） */
function saveSearchHistory(text: string): void {
  const list = getSearchHistory();
  const filtered = list.filter((s) => s.text !== text);
  filtered.unshift({ text, type: 'history' });
  const trimmed = filtered.slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
}

// =====================================================================
// 核心搜索逻辑
// =====================================================================

/**
 * 执行跨模块聚合搜索（带防抖 300ms）。
 *
 * <p>防抖由 useDebounceFn 在 300ms 内最后一次触发。
 */
const doSearch = useDebounceFn(async (kw: string) => {
  if (!kw.trim()) {
    results.value = null;
    loading.value = false;
    return;
  }

  loading.value = true;
  try {
    const { data } = await systemClient.get<GlobalSearchResponse>(SEARCH_API, {
      params: { keyword: kw.trim(), pageSize: 20 },
    });
    results.value = data;
    saveSearchHistory(kw.trim());
    // 默认切到全部
    activeTab.value = '_all';
  } catch (err) {
    // 失败时清空搜索结果并保留上一次（避免界面闪烁）
    // eslint-disable-next-line no-console -- 网络异常由监控捕获
    console.warn('[GlobalSearch] search failed:', err);
  } finally {
    loading.value = false;
  }
}, 300);

/**
 * 执行搜索建议获取（更轻量，可在 keyup 时触发）。
 */
const doSuggest = useDebounceFn(async (kw: string) => {
  if (!kw.trim() || kw.trim().length < 2) {
    suggestions.value = getSearchHistory();
    return;
  }
  try {
    const { data } = await systemClient.get<SearchSuggestion[]>(SUGGEST_API, {
      params: { keyword: kw.trim(), limit: 8 },
    });
    suggestions.value = data;
  } catch {
    // 建议失败时降级为历史记录
    suggestions.value = getSearchHistory();
  }
}, 150);

/**
 * 触发搜索（外部调用点：input 事件、mounted 钩子等）。
 */
function executeSearch(): void {
  const kw = keyword.value;
  void doSearch(kw);
  void doSuggest(kw);
}

/**
 * 选中建议项（填充到 keyword 并触发搜索）。
 */
function selectSuggestion(item: SearchSuggestion): void {
  keyword.value = item.text;
  executeSearch();
}

/**
 * 清空搜索（结果 + 关键词），回到初始历史建议态。
 */
function clearSearch(): void {
  keyword.value = '';
  results.value = null;
  suggestions.value = getSearchHistory();
}

// =====================================================================
// 计算属性：当前 tab 的结果集
// =====================================================================

/** 当前 tab 命中的结果列表 */
const currentModuleHits = computed<SearchHit[] | null>(() => {
  if (!results.value) return null;
  if (activeTab.value === '_all') {
    return results.value.hits;
  }
  return results.value.moduleHits?.[activeTab.value] ?? [];
});

/** 全部结果总数 */
const totalHits = computed<number>(() => {
  if (!results.value) return 0;
  if (results.value.moduleHits) {
    return Object.values(results.value.moduleHits).reduce((sum, hits) => sum + hits.length, 0);
  }
  return results.value.total;
});

// =====================================================================
// 监听：keyword 为空时清空结果
// =====================================================================

watch(keyword, (kw) => {
  if (!kw) {
    results.value = null;
    suggestions.value = getSearchHistory();
  }
  if (kw.length >= 2) {
    suggestions.value = getSearchHistory();
  }
});

// =====================================================================
// 导出（响应式状态 + 命令式函数）
// =====================================================================

export function useGlobalSearch() {
  return {
    // 状态
    activeTab,
    keyword,
    loading,
    results,
    suggestions,
    // 计算属性
    currentModuleHits,
    totalHits,
    // 命令
    clearSearch,
    executeSearch,
    selectSuggestion,
    // 历史管理（供外部调用）
    getSearchHistory,
    saveSearchHistory,
  };
}
