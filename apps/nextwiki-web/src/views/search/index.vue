<!--
 * 全文搜索（列表页）
 *
 * @path apps\nextwiki-web\src\views\search\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 全文搜索（列表页）
 * <p>消费后端契约 SearchController（apps/nextwiki-web/src/api/search.ts）：
 * search() 执行全文搜索，suggest() 搜索建议，didYouMean() 拼写纠错，
 * getSearchHistory() 搜索历史，clearSearchHistory() 清空历史，getHotSearches() 热门搜索。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { Page } from '@ydsz/common-ui';
import { ElButton, ElEmpty, ElInput, ElOption, ElPagination, ElSelect, ElTag } from 'element-plus';
import { computed, onMounted, ref, watch } from 'vue';
import {
  advancedSearch,
  clearSearchHistory,
  didYouMean,
  getHotSearches,
  getSearchHistory,
  search,
  suggest,
} from '#/api/search';
import type { SearchRequest, SearchResultVO } from '#/api/models';

defineOptions({ name: 'FullTextSearch' });

/** 搜索关键字 */
const keyword = ref('');
/** 搜索类型过滤 */
const searchType = ref<string>('');
/** 搜索页码 */
const currentPage = ref(1);
/** 每页数量 */
const pageSize = ref(20);
/** 搜索结果 */
const searchResult = ref<SearchResultVO | null>(null);
/** 搜索加载状态 */
const loading = ref(false);
/** 搜索建议列表 */
const suggestions = ref<string[]>([]);
/** 拼写纠错建议 */
const corrections = ref<string[]>([]);
/** 搜索历史 */
const searchHistory = ref<string[]>([]);
/** 热门搜索 */
const hotSearches = ref<Array<{ keyword: string; count: number }>>([]);
/** 是否已执行搜索 */
const hasSearched = ref(false);
/** 搜索耗时 */
const searchTookMs = ref(0);

/** 搜索类型选项 */
const typeOptions = [
  { label: '全部', value: '' },
  { label: '文档', value: 'DOCUMENT' },
  { label: '图片', value: 'IMAGE' },
  { label: '视频', value: 'VIDEO' },
  { label: '音频', value: 'AUDIO' },
  { label: '其他', value: 'OTHER' },
];

/** 是否有搜索结果 */
const hasResults = computed(() => (searchResult.value?.total ?? 0) > 0);

/** 执行搜索 */
async function handleSearch(): Promise<void> {
  if (!keyword.value.trim()) return;
  loading.value = true;
  hasSearched.value = true;
  currentPage.value = 1;
  try {
    const request: SearchRequest = {
      keyword: keyword.value.trim(),
      page: currentPage.value,
      pageSize: pageSize.value,
      highlight: true,
      highlightPreTag: '<em class="text-red-500 font-bold">',
      highlightPostTag: '</em>',
      fuzzy: true,
    };
    if (searchType.value) {
      request.types = [searchType.value];
    }
    const result = await search(request);
    searchResult.value = result;
    searchTookMs.value = result.tookMs ?? 0;
    await loadSearchHistory();
  } catch {
    // 错误提示由请求拦截器统一处理
  } finally {
    loading.value = false;
  }
}

/** 翻页 */
async function handlePageChange(page: number): Promise<void> {
  currentPage.value = page;
  await executeSearch();
}

/** 执行搜索（不重置页码） */
async function executeSearch(): Promise<void> {
  if (!keyword.value.trim()) return;
  loading.value = true;
  try {
    const request: SearchRequest = {
      keyword: keyword.value.trim(),
      page: currentPage.value,
      pageSize: pageSize.value,
      highlight: true,
      highlightPreTag: '<em class="text-red-500 font-bold">',
      highlightPostTag: '</em>',
      fuzzy: true,
    };
    if (searchType.value) {
      request.types = [searchType.value];
    }
    const result = await search(request);
    searchResult.value = result;
    searchTookMs.value = result.tookMs ?? 0;
  } catch {
    // 错误提示由请求拦截器统一处理
  } finally {
    loading.value = false;
  }
}

/** 加载搜索建议 */
async function handleSuggest(prefix: string): Promise<void> {
  if (!prefix.trim()) {
    suggestions.value = [];
    return;
  }
  try {
    suggestions.value = await suggest({ prefix: prefix.trim() });
  } catch {
    suggestions.value = [];
  }
}

/** 加载拼写纠错 */
async function loadDidYouMean(): Promise<void> {
  if (!keyword.value.trim()) {
    corrections.value = [];
    return;
  }
  try {
    corrections.value = await didYouMean({ keyword: keyword.value.trim() });
  } catch {
    corrections.value = [];
  }
}

/** 加载搜索历史 */
async function loadSearchHistory(): Promise<void> {
  try {
    searchHistory.value = await getSearchHistory();
  } catch {
    searchHistory.value = [];
  }
}

/** 加载热门搜索 */
async function loadHotSearches(): Promise<void> {
  try {
    const result = await getHotSearches();
    hotSearches.value = result.map((item) => ({
      keyword: (item.keyword as string) ?? '',
      count: (item.count as number) ?? 0,
    }));
  } catch {
    hotSearches.value = [];
  }
}

/** 清空搜索历史 */
async function handleClearHistory(): Promise<void> {
  try {
    await clearSearchHistory();
    searchHistory.value = [];
  } catch {
    // 错误提示由请求拦截器统一处理
  }
}

/** 点击搜索历史 */
function handleHistoryClick(historyKeyword: string): void {
  keyword.value = historyKeyword;
  handleSearch();
}

/** 点击热门搜索 */
function handleHotClick(hotKeyword: string): void {
  keyword.value = hotKeyword;
  handleSearch();
}

/** 点击纠错建议 */
function handleCorrectionClick(correction: string): void {
  keyword.value = correction;
  handleSearch();
}

/** 高级搜索 */
async function handleAdvancedSearch(): Promise<void> {
  if (!keyword.value.trim()) return;
  loading.value = true;
  try {
    const result = await advancedSearch({
      rawInput: keyword.value.trim(),
      page: currentPage.value,
      pageSize: pageSize.value,
    });
    searchResult.value = result;
  } catch {
    // 错误提示由请求拦截器统一处理
  } finally {
    loading.value = false;
  }
}

/** 格式化文件大小 */
function formatSize(size?: number): string {
  if (size === undefined || size < 0) return '-';
  if (size < 1024) return `${size} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = size;
  let unit = 'KB';
  for (const u of units) {
    value /= 1024;
    unit = u;
    if (value < 1024) break;
  }
  return `${value.toFixed(1)} ${unit}`;
}

watch(keyword, async (val) => {
  if (val.trim()) {
    await handleSuggest(val);
    await loadDidYouMean();
  } else {
    suggestions.value = [];
    corrections.value = [];
  }
});

onMounted(async () => {
  await loadSearchHistory();
  await loadHotSearches();
});
</script>

<template>
  <Page auto-content-height>
    <div class="search-container mx-auto max-w-5xl p-6">
      <!-- 搜索头部 -->
      <div class="mb-6">
        <h1 class="mb-4 text-2xl font-bold text-gray-800">全文搜索</h1>
        <div class="flex gap-2">
          <ElInput
            v-model="keyword"
            placeholder="输入关键字搜索文件..."
            size="large"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #append>
              <ElButton type="primary" :loading="loading" @click="handleSearch">搜索</ElButton>
            </template>
          </ElInput>
          <ElSelect v-model="searchType" placeholder="类型" size="large" class="w-32">
            <ElOption v-for="opt in typeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </ElSelect>
          <ElButton size="large" @click="handleAdvancedSearch">高级搜索</ElButton>
        </div>

        <!-- 搜索建议下拉 -->
        <div v-if="suggestions.length > 0" class="mt-2 rounded border bg-white p-2 shadow">
          <p
            v-for="s in suggestions"
            :key="s"
            class="cursor-pointer rounded px-3 py-1.5 text-sm hover:bg-gray-100"
            @click="handleHistoryClick(s)"
          >
            {{ s }}
          </p>
        </div>

        <!-- 拼写纠错 -->
        <div v-if="corrections.length > 0" class="mt-2 text-sm text-gray-500">
          您是不是要搜：
          <span
            v-for="c in corrections"
            :key="c"
            class="mr-2 cursor-pointer text-blue-500 underline"
            @click="handleCorrectionClick(c)"
          >{{ c }}</span>
        </div>
      </div>

      <div class="flex gap-6">
        <!-- 搜索结果区 -->
        <div class="flex-1">
          <!-- 搜索结果统计 -->
          <div v-if="hasSearched && searchResult" class="mb-3 text-sm text-gray-500">
            找到 {{ searchResult.total ?? 0 }} 条结果（用时 {{ searchTookMs }}ms）
          </div>

          <!-- 搜索结果列表 -->
          <div v-if="hasResults" class="space-y-3">
            <div
              v-for="item in searchResult?.hits"
              :key="item.fileNodeId"
              class="rounded border bg-white p-4 transition-shadow hover:shadow-md"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h3 class="cursor-pointer text-base font-medium text-blue-600 hover:underline">
                    <span v-safe-html="item.highlight || item.name"></span>
                  </h3>
                  <p class="mt-1 text-sm text-gray-500">{{ item.path }}</p>
                  <div class="mt-2 flex items-center gap-3 text-xs text-gray-400">
                    <span>{{ formatSize(item.size) }}</span>
                    <span>{{ item.suffix?.toUpperCase() }}</span>
                    <span>{{ item.updatedAt }}</span>
                  </div>
                </div>
                <ElTag v-if="item.nodeType" size="small" type="info">{{ item.nodeType }}</ElTag>
              </div>
            </div>
          </div>

          <!-- 分页 -->
          <div v-if="hasResults && (searchResult?.total ?? 0) > pageSize" class="mt-4 flex justify-center">
            <ElPagination
              v-model:current-page="currentPage"
              :page-size="pageSize"
              :total="searchResult?.total ?? 0"
              layout="prev, pager, next, jumper"
              @current-change="handlePageChange"
            />
          </div>

          <!-- 无结果 -->
          <ElEmpty v-if="hasSearched && !hasResults" description="未找到匹配的结果" />
        </div>

        <!-- 侧边栏 -->
        <div class="w-64 shrink-0">
          <!-- 搜索历史 -->
          <div v-if="searchHistory.length > 0" class="mb-6 rounded border bg-white p-4">
            <div class="mb-3 flex items-center justify-between">
              <h3 class="text-sm font-medium text-gray-700">搜索历史</h3>
              <ElButton size="small" link type="primary" @click="handleClearHistory">清空</ElButton>
            </div>
            <div class="flex flex-wrap gap-2">
              <ElTag
                v-for="history in searchHistory"
                :key="history"
                class="cursor-pointer"
                type="info"
                effect="plain"
                @click="handleHistoryClick(history)"
              >
                {{ history }}
              </ElTag>
            </div>
          </div>

          <!-- 热门搜索 -->
          <div v-if="hotSearches.length > 0" class="rounded border bg-white p-4">
            <h3 class="mb-3 text-sm font-medium text-gray-700">热门搜索</h3>
            <div class="space-y-2">
              <div
                v-for="(hot, index) in hotSearches"
                :key="hot.keyword"
                class="flex cursor-pointer items-center gap-2 text-sm hover:text-blue-500"
                @click="handleHotClick(hot.keyword)"
              >
                <span class="w-5 text-center text-xs" :class="index < 3 ? 'font-bold text-red-500' : 'text-gray-400'">
                  {{ index + 1 }}
                </span>
                <span class="flex-1 truncate">{{ hot.keyword }}</span>
                <span class="text-xs text-gray-400">{{ hot.count }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Page>
</template>

<style scoped>
.search-container {
  min-height: calc(100vh - 120px);
}
</style>
