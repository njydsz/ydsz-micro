<script setup lang="ts">
/**
 * 全局搜索结果页（P1-1 全局搜索前端化）。
 *
 * <p>跨实体类型统一检索入口，支持分类 Tab 切换、关键词高亮、分页、热门/零结果词分析。
 *
 * @path apps\system-web\src\views\global-search\index.vue
 * @author ydsz-team
 * @since 26.10.09
 */

import { computed, onMounted, ref, watch } from 'vue';

import { useI18n } from '#/composables/use-i18n';
import {
  type SearchRequest,
  type SearchResponse,
  type SearchResultItem,
  type HotKeyword,
  type SearchSummary,
  search,
  hotKeywords,
  zeroResultKeywords,
  summary,
} from '#/api/globalSearch';

const { t } = useI18n();

// ======================== 状态 ========================

/** 搜索关键词 */
const keyword = ref('');

/** 当前分类 Tab */
const activeTab = ref('all');

/** 搜索结果 */
const searchResult = ref<SearchResponse>({});

/** 加载状态 */
const loading = ref(false);

/** 当前页码 */
const currentPage = ref(1);

/** 每页条数 */
const pageSize = ref(20);

/** 搜索会话 ID（用于点击反馈去重） */
const sessionId = ref(crypto.randomUUID());

/** 热门关键词 */
const hotWords = ref<HotKeyword[]>([]);

/** 搜索概览 */
const searchSummary = ref<SearchSummary>({});

// ======================== 分类选项 ========================

const tabs = computed(() => [
  { key: 'all', label: t('system.search.tabAll') || '全部' },
  { key: 'task', label: t('system.search.tabTask') || '任务' },
  { key: 'message', label: t('system.search.tabMessage') || '消息' },
  { key: 'rule', label: t('system.search.tabRule') || '规则' },
  { key: 'doc', label: t('system.search.tabDoc') || '文档' },
]);

// ======================== 方法 ========================

/** 执行搜索 */
async function doSearch(page: number = 1) {
  if (!keyword.value.trim()) return;
  loading.value = true;
  currentPage.value = page;
  try {
    const params: SearchRequest = {
      keyword: keyword.value,
      page,
      pageSize: pageSize.value,
      ...(activeTab.value !== 'all' ? { types: [activeTab.value] } : {}),
    };
    const res = await search(params);
    searchResult.value = res || {};
  } catch {
    searchResult.value = {};
  } finally {
    loading.value = false;
  }
}

/** 键盘回车搜索 */
function handleEnterSearch() {
  sessionId.value = crypto.randomUUID();
  doSearch(1);
}

/** 切换分类 */
function handleTabChange(key: string) {
  activeTab.value = key;
  if (keyword.value.trim()) {
    doSearch(1);
  }
}

/** 分页切换 */
function handlePageChange(page: number) {
  doSearch(page);
}

/** 结果点击 */
function handleItemClick(item: SearchResultItem, position: number) {
  if (item.url) {
    window.open(item.url, '_blank');
  }
}

// ======================== 初始化 ========================

onMounted(async () => {
  try {
    const [hot, sum] = await Promise.all([hotKeywords(8), summary()]);
    hotWords.value = hot || [];
    searchSummary.value = sum || {};
  } catch {
    // 分析接口非关键，静默失败
  }
});

/** 关键词防抖（300ms） */
let debounceTimer: ReturnType<typeof setTimeout>;
watch(keyword, () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    if (keyword.value.trim()) doSearch(1);
  }, 300);
});
</script>

<template>
  <div class="global-search-container p-4">
    <!-- 顶部搜索栏 -->
    <div class="search-header mb-4">
      <div class="flex items-center gap-3">
        <input
          v-model="keyword"
          class="search-input flex-1 rounded-md border px-4 py-2 text-base outline-none focus:border-blue-500"
          :placeholder="t('system.search.placeholder') || '搜索任务、消息、规则、文档...'"
          @keyup.enter="handleEnterSearch"
        />
        <button
          class="search-btn rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
          :disabled="loading"
          @click="handleEnterSearch"
        >
          {{ t('system.search.btnSearch') || '搜索' }}
        </button>
      </div>

      <!-- 热门词推荐 -->
      <div v-if="hotWords.length && !keyword" class="mt-3 flex flex-wrap gap-2 text-sm text-gray-500">
        <span>{{ t('system.search.hot') || '热门搜索' }}:</span>
        <span
          v-for="word in hotWords"
          :key="word.keyword"
          class="cursor-pointer text-blue-500 hover:underline"
          @click="keyword = word.keyword; doSearch(1)"
        >
          {{ word.keyword }}
        </span>
      </div>
    </div>

    <!-- 分类 Tab -->
    <div class="search-tabs mb-4 flex gap-1 border-b">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-item border-b-2 px-4 py-2 text-sm transition-colors"
        :class="activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
        @click="handleTabChange(tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 结果统计 -->
    <div v-if="keyword && searchResult.total !== undefined" class="mb-3 text-sm text-gray-500">
      {{ t('system.search.resultCount') || '找到' }}
      <span class="font-semibold text-gray-700">{{ searchResult.total }}</span>
      {{ t('system.search.resultUnit') || '条结果' }}
      <span v-if="searchResult.took" class="text-gray-400">({{ searchResult.took }}ms)</span>
    </div>

    <!-- 结果列表 -->
    <div v-if="loading" class="flex justify-center py-12 text-gray-400">
      {{ t('system.search.loading') || '搜索中...' }}
    </div>

    <div v-else-if="!keyword" class="flex flex-col items-center justify-center py-16 text-gray-400">
      <i class="lucide-search mb-4 text-4xl" />
      <p>{{ t('system.search.emptyHint') || '输入关键词开始搜索' }}</p>
      <div v-if="searchSummary.totalSearches" class="mt-4 text-xs">
        {{ t('system.search.totalSearches') || '累计搜索' }}: {{ searchSummary.totalSearches }}
      </div>
    </div>

    <div v-else-if="!searchResult.items?.length" class="py-12 text-center text-gray-400">
      {{ t('system.search.noResult') || '未找到匹配结果' }}
      <div v-if="(searchSummary.zeroResultRate || 0) > 0" class="mt-2 text-xs">
        {{ t('system.search.zeroResultRate') || '零结果率' }}:
        {{ ((searchSummary.zeroResultRate || 0) * 100).toFixed(1) }}%
      </div>
    </div>

    <!-- 搜索结果列表 -->
    <div v-else class="search-result-list space-y-3">
      <div
        v-for="(item, idx) in searchResult.items"
        :key="item.id || idx"
        class="result-item cursor-pointer rounded-md border p-4 transition-colors hover:bg-gray-50"
        @click="handleItemClick(item, idx + 1)"
      >
        <div class="mb-1 flex items-center gap-2">
          <span class="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
            {{ item typeName || item.type || '未知' }}
          </span>
          <span class="text-sm font-medium">{{ item.title || item.id }}</span>
        </div>
        <p v-if="item.content" class="text-sm text-gray-600">{{ item.content }}</p>
        <div v-if="item.highlight?.length" class="mt-1 text-xs text-gray-400">
          <span v-for="(h, i) in item.highlight" :key="i" class="mr-2" v-html="h" />
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="searchResult.total && searchResult.total > pageSize" class="mt-6 flex justify-center">
      <div class="flex gap-1">
        <button
          class="rounded border px-3 py-1 text-sm disabled:opacity-50"
          :disabled="currentPage <= 1"
          @click="handlePageChange(currentPage - 1)"
        >
          &laquo;
        </button>
        <span class="px-3 py-1 text-sm">
          {{ currentPage }} / {{ Math.ceil((searchResult.total || 0) / pageSize) }}
        </span>
        <button
          class="rounded border px-3 py-1 text-sm disabled:opacity-50"
          :disabled="currentPage >= Math.ceil((searchResult.total || 0) / pageSize)"
          @click="handlePageChange(currentPage + 1)"
        >
          &raquo;
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.global-search-container {
  max-width: 960px;
  margin: 0 auto;
}
.search-input {
  transition: border-color 0.2s;
}
</style>
