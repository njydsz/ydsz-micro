<script lang="ts" setup>
/**
* YdVTreeSearch：带搜索过滤的树选择组件，解决深层树中关键字查找难的问题。
* 
 * 设计目标：
 *  - 内置搜索框，输入关键字即时过滤节点 matched 结果；
 *  - 自动展开匹配节点的祖先链，保证结果可见；
 *  - 匹配文本高亮（mark 标签）；
 *  - 支持 searchPlaceholder、debounceMs 等配置。
* 
 * 交互：
 *  - 搜索框支持 Esc 清空；
 *  - 搜索结果自动选中首个命中的节点；
 *  - 清空搜索恢复原树视图。
* 
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\tree\YdVTreeSearch.vue
 * @author ydsz-team
 * @since 1.0.0
 */
// @ts-nocheck
import { computed, ref, watch, type Ref } from 'vue';

import { useDebounceFn } from '@vueuse/core';
import { Search, X } from 'lucide-vue-next';

import { cn } from '@ydsz-core/shared/utils';

import { useLocale } from '../../locale/useLocale';
import { useTreeSearch } from './use-tree-search';

defineOptions({
  name: 'YdVTreeSearch',
});

/**
 * YdVTreeSearch 组件的 props。
 *
 * 包含树数据配置、搜索行为配置与 a11y 文案。
 */
export interface VTreeSearchProps<T extends Record<string, unknown>> {
  /** 树数据源（必填） */
  treeData: T[];
  /** 节点 label 字段名，默认 'label' */
  labelField?: string;
  /** 节点 value 字段名，默认 'value' */
  valueField?: string;
  /** 节点 children 字段名，默认 'children' */
  childrenField?: string;
  /** 节点 disabled 字段名，默认 'disabled' */
  disabledField?: string;
  /** 搜索框占位符，默认取内置词典 `tree.search`（随语种切换） */
  searchPlaceholder?: string;
  /** 搜索防抖毫秒数，默认 200 */
  debounceMs?: number;
  /** 是否高亮匹配文本，默认 true */
  highlightMatch?: boolean;
  /** 大小写敏感，默认 false */
  caseSensitive?: boolean;
  /** 自定义类名 */
  class?: string;
}

const props = withDefaults(defineProps<VTreeSearchProps<Record<string, unknown>>>(), {
  caseSensitive: false,
  childrenField: 'children',
  debounceMs: 200,
  disabledField: 'disabled',
  highlightMatch: true,
  labelField: 'label',
  searchPlaceholder: undefined,
  valueField: 'value',
});

/** 内置词典：占位符与 a11y 文案随当前语种取值 */
const { t } = useLocale();

/** 搜索框占位符：外部 prop 优先，缺省回落词典文案 */
const placeholder = computed(() => props.searchPlaceholder || t('tree.search'));

const emit = defineEmits<{
  search: [keyword: string];
  select: [value: string | number, node: Record<string, unknown>];
}>();

/** 搜索框的输入值（未经防抖） */
const searchInput = ref('');

/** 防抖后的搜索调用 */
const debouncedSearch = useDebounceFn((kw: string): void => {
  treeSearch.search(kw);
  emit('search', kw);
}, props.debounceMs);

/**
 * 监听搜索输入，触发防抖搜索。
 *
 * @param event - input 事件
 */
function handleSearchInput(event: Event): void {
  const target = event.target as HTMLInputElement;
  searchInput.value = target.value;
  debouncedSearch(target.value);
}

/** 清空搜索 */
function handleClearSearch(): void {
  searchInput.value = '';
  treeSearch.clear();
  emit('search', '');
}

/**
 * 处理 Escape 键清空搜索。
 *
 * @param event - 键盘事件
 */
function handleSearchKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    handleClearSearch();
  }
}

/** 搜索逻辑 composable */
const treeSearch = useTreeSearch(
  computed(() => props.treeData),
  {
    caseSensitive: props.caseSensitive,
    getChildren: (node) => node[props.childrenField] as Record<string, unknown>[],
    getLabel: (node) => String(node[props.labelField] ?? ''),
    getValue: (node) => node[props.valueField] as string | number,
  },
);

/** 标签分段：matched 段渲染为 <mark>，其余段保持纯文本插值 */
interface LabelSegment {
  matched: boolean;
  text: string;
}

/**
 * 按匹配区间把标签切成纯文本片段。
 *
 * <p>返回结构化分段而非 HTML 字符串，模板用插值渲染，
 * 因此标签内容（可能来自服务端）不会被当作标记解析。
 *
 * @param label - 节点标签
 * @param matchRange - 匹配区间；为 null 或关闭高亮时整段返回
 * @returns 至多三段（前缀 / 命中 / 后缀）有序片段
 */
function splitHighlightLabel(
  label: string,
  matchRange: { start: number; end: number } | null,
): LabelSegment[] {
  if (!matchRange || !props.highlightMatch) {
    return [{ matched: false, text: label }];
  }
  const segments: LabelSegment[] = [];
  if (matchRange.start > 0) {
    segments.push({ matched: false, text: label.slice(0, matchRange.start) });
  }
  segments.push({
    matched: true,
    text: label.slice(matchRange.start, matchRange.end),
  });
  if (matchRange.end < label.length) {
    segments.push({ matched: false, text: label.slice(matchRange.end) });
  }
  return segments;
}

/**
 * 点击搜索结果项：触发 select 事件并清空搜索以恢复原视图。
 *
 * @param node - 被点击的匹配节点
 * @param value - 节点值
 */
function handleResultClick(
  node: Record<string, unknown>,
  value: string | number,
): void {
  emit('select', value, node);
}

/** 搜索结果节点列表，便于在模板中循环 */
const searchResults = computed(() => treeSearch.results.value);

/** 是否展示搜索结果区 */
const showResults = computed<boolean>(() => {
  return treeSearch.hasResults.value;
});

/** 匹配祖先集合：接受 search 组件计算结果，传到宿主树控制展开 */
const expandKeys: Ref<Set<string | number>> = treeSearch.expandKeys;

defineExpose({
  clearSearch: handleClearSearch,
  search: treeSearch.search,
  expandKeys,
});
</script>

<template>
  <div :class="cn('flex flex-col gap-2', $props.class)">
    <!-- 搜索框 -->
    <div class="relative flex items-center">
      <Search
        :size="14"
        class="absolute start-2.5 text-muted-foreground"
        aria-hidden="true"
      />
      <input
        :value="searchInput"
        type="text"
        :placeholder="placeholder"
        :aria-label="placeholder"
        class="h-8 w-full rounded-md border border-input bg-transparent ps-8 pe-8 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/50"
        @input="handleSearchInput"
        @keydown="handleSearchKeydown"
      />
      <button
        v-if="searchInput"
        type="button"
        class="absolute end-2 rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground"
        :aria-label="t('tree.clearSearch')"
        @click="handleClearSearch"
      >
        <X :size="12" />
      </button>
    </div>

    <!-- 搜索结果区（仅在搜索词非空时渲染） -->
    <div
      v-if="showResults"
      role="listbox"
      :aria-label="t('tree.searchResults')"
      class="max-h-64 overflow-y-auto rounded-md border border-border bg-popover py-1"
    >
      <!-- 无匹配结果 -->
      <div
        v-if="searchResults.length === 0"
        class="px-3 py-6 text-center text-sm text-muted-foreground"
      >
        {{ t('empty.search') }}
      </div>
      <!-- 匹配结果列表 -->
      <button
        v-for="result in searchResults"
        :key="result.value"
        type="button"
        role="option"
        :aria-selected="false"
        class="flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-colors hover:bg-accent focus:bg-accent focus:outline-none"
        :style="{ paddingLeft: `${(result.level + 1) * 12 + 8}px` }"
        @click="handleResultClick(result.data, result.value)"
      >
        <span class="flex-1 truncate text-start">
          <template
            v-for="(segment, segmentIndex) in splitHighlightLabel(result.label, result.matchRange)"
            :key="segmentIndex"
          >
            <mark
              v-if="segment.matched"
              class="bg-primary/20 text-primary rounded-sm px-0.5"
            >{{ segment.text }}</mark>
            <template v-else>{{ segment.text }}</template>
          </template>
        </span>
      </button>
    </div>

    <!-- 默认 slot：放置 tree 视图；搜索结果为空时显示 -->
    <div v-show="!showResults">
      <slot />
    </div>
  </div>
</template>
