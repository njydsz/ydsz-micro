<!--
  全局搜索面板 —— 跨模块聚合搜索 UI 组件。

  功能：
  - 搜索框 + 自动补全建议
  - 搜索结果按模块分组（Tabs：全部 / 用户 / 流程 / 消息 / 文件 / ...）
  - 支持上下键选择、Enter 打开详情
  - 结果命中关键词高亮（highlight 字段优先）

  依赖的搜索 API：
  - GET /api/v1/search/unified?keyword=xxx（跨模块聚合搜索）
  - GET /api/v1/search/suggest?keyword=xxx（输入建议）

@path comm/@core/ui-kit/shadcn-ui/src/components/search/global-search-panel.vue
@author ydsz-team
@since 4.1.0 (P2-13)
-->
<script setup lang="ts">
import { ref } from 'vue';

import { onClickOutside } from '@vueuse/core';

import type { SearchHit, SearchSuggestion } from './search-types';
import { MODULE_ICONS, MODULE_LABELS } from './search-types';
import { useGlobalSearch } from './use-global-search';

// =====================================================================
// 辅助函数
// =====================================================================

/** 模块标签显示名 */
function moduleLabel(moduleKey: string): string {
  return MODULE_LABELS[moduleKey] || moduleKey;
}

/** 模块图标名 */
function moduleIcon(moduleKey?: string): string {
  if (!moduleKey) return 'lucide:search';
  return MODULE_ICONS[moduleKey] || 'lucide:file';
}

// =====================================================================
// Props / Emits
// =====================================================================

interface Props {
  /** 是否显示模态框（false 时为 inline panel） */
  modal?: boolean;
  /** 占位文案 */
  placeholder?: string;
  /** 自动聚焦 */
  autofocus?: boolean;
}

withDefaults(defineProps<Props>(), {
  modal: false,
  placeholder: '搜索用户、流程、消息、文件...',
  autofocus: false,
});

const emit = defineEmits<{
  (e: 'select', hit: SearchHit): void;
  (e: 'close'): void;
}>();

// =====================================================================
// composable 集成
// =====================================================================

const {
  keyword,
  loading,
  results,
  suggestions,
  activeTab,
  currentModuleHits,
  totalHits,
  executeSearch,
  selectSuggestion,
  clearSearch,
} = useGlobalSearch();

// =====================================================================
// 面板显隐控制（inline 模式下由父级控制；modal 模式下由 visible 控制）
// =====================================================================

const panelRef = ref<HTMLElement | null>(null);
const visible = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);

/** 打开面板 */
function open() {
  visible.value = true;
  setTimeout(() => inputRef.value?.focus(), 50);
}

/** 关闭面板 */
function close() {
  visible.value = false;
  clearSearch();
  emit('close');
}

// 点击面板外部关闭（仅 modal 模式）
onClickOutside(panelRef, () => {
  if (modal) close();
});

// 键盘导航
const focusedIndex = ref(-1);

function handleKeydown(event: KeyboardEvent) {
  if (!visible.value) return;
  const hits = currentModuleHits.value;
  if (!hits) return;
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    focusedIndex.value = Math.min(focusedIndex.value + 1, hits.length - 1);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    focusedIndex.value = Math.max(focusedIndex.value - 1, -1);
  } else if (event.key === 'Enter' && focusedIndex.value >= 0) {
    const hit = hits[focusedIndex.value];
    if (hit) {
      emit('select', hit);
      close();
    }
  } else if (event.key === 'Escape') {
    close();
  }
}

// 模块 tab 切换
function setActiveTab(tab: string) {
  activeTab.value = tab;
  focusedIndex.value = -1;
}

// 点击结果项
function handleSelect(hit: SearchHit) {
  emit('select', hit);
  close();
}

defineExpose({ open, close });
</script>

<template>
  <div
    ref="panelRef"
    class="global-search"
    :class="{ 'global-search--modal': modal, 'global-search--visible': visible }"
    @keydown="handleKeydown"
  >
    <!-- 搜索输入 -->
    <div class="global-search__input-wrapper">
      <VbenIcon icon="lucide:search" class="global-search__icon" />
      <input
        ref="inputRef"
        v-model="keyword"
        type="text"
        class="global-search__input"
        :placeholder="placeholder"
        autocomplete="off"
        @input="executeSearch"
      />
    </div>

    <!-- 搜索建议（keyword 非空但尚未触发搜索时） -->
    <ul v-if="suggestions.length > 0 && !results" class="global-search__suggestions">
      <li
        v-for="(item, idx) in suggestions"
        :key="idx"
        class="global-search__suggestion-item"
        @click="selectSuggestion(item)"
      >
        <VbenIcon icon="lucide:history" class="mr-2" />
        <span>{{ item.text }}</span>
      </li>
    </ul>

    <!-- 搜索结果 -->
    <div v-if="results" class="global-search__results">
      <!-- 模块 tab（仅在多模块有结果时显示） -->
      <div v-if="results.moduleHits && Object.keys(results.moduleHits).length > 1" class="global-search__tabs">
        <button
          class="global-search__tab"
          :class="{ 'global-search__tab--active': activeTab === '_all' }"
          @click="setActiveTab('_all')"
        >
          全部 (<span>{{ totalHits }}</span>)
        </button>
        <button
          v-for="(hits, moduleKey) in results.moduleHits"
          :key="moduleKey"
          class="global-search__tab"
          :class="{ 'global-search__tab--active': activeTab === moduleKey }"
          @click="setActiveTab(moduleKey)"
        >
          {{ moduleLabel(moduleKey) }} (<span>{{ hits.length }}</span>)
        </button>
      </div>

      <!-- 加载态 -->
      <div v-if="loading" class="global-search__loading">
        <VbenIcon icon="lucide:loader-2" class="animate-spin" />
      </div>

      <!-- 结果列表 -->
      <ul v-else-if="currentModuleHits && currentModuleHits.length > 0" class="global-search__list">
        <li
          v-for="(hit, idx) in currentModuleHits"
          :key="hit.id"
          class="global-search__item"
          :class="{ 'global-search__item--focused': focusedIndex === idx }"
          @click="handleSelect(hit)"
        >
          <!-- 图标 -->
          <VbenIcon :icon="moduleIcon(hit.moduleKey)" class="global-search__item-icon" />
          <!-- 内容 -->
          <div class="global-search__item-content">
            <div class="global-search__item-title" v-html="hit.highlight?.title || hit.title" />
            <div v-if="hit.description" class="global-search__item-desc" v-html="hit.highlight?.description || hit.description" />
            <div v-if="hit.tags && hit.tags.length > 0" class="global-search__item-tags">
              <span v-for="tag in hit.tags" :key="tag" class="global-search__tag">{{ tag }}</span>
            </div>
          </div>
          <!-- 模块来源标记 |
          <span class="global-search__item-meta">{{ moduleLabel(hit.moduleKey || '') }}</span>
        </li>
      </ul>

      <!-- 空结果 -->
      <div v-else class="global-search__empty">
        <VbenIcon icon="lucide:search-x" />
        <p>未找到与「{{ keyword }}」相关的结果</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.global-search {
  --gs-bg: var(--popover, #fff);
  --gs-border: var(--border, #e5e7eb);
  --gs-radius: 8px;
  --gs-shadow: 0 8px 32px rgb(0 0 0 / 12%);

  width: 600px;
  max-height: 70vh;
  background: var(--gs-bg);
  border-radius: var(--gs-radius);
  box-shadow: var(--gs-shadow);
  overflow: hidden;
}

.global-search--modal {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: none;
  justify-content: center;
  padding-top: 15vh;
  background: rgb(0 0 0 / 30%);
}

.global-search--visible {
  display: flex;
}

.global-search__input-wrapper {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--gs-border);
}

.global-search__icon {
  margin-right: 8px;
  color: #9ca3af;
}

.global-search__input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 16px;
  background: transparent;
}

.global-search__tabs {
  display: flex;
  gap: 4px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--gs-border);
  overflow-x: auto;
}

.global-search__tab {
  padding: 4px 10px;
  border: none;
  background: transparent;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  color: #6b7280;
}

.global-search__tab--active {
  background: var(--primary-light, #eff6ff);
  color: var(--primary, #3b82f6);
  font-weight: 600;
}

.global-search__list {
  max-height: 400px;
  overflow-y: auto;
  list-style: none;
  margin: 0;
  padding: 4px 0;
}

.global-search__item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.15s;
}

.global-search__item:hover,
.global-search__item--focused {
  background: var(--hover, #f3f4f6);
}

.global-search__item-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  color: var(--primary, #3b82f6);
  margin-top: 2px;
}

.global-search__item-content {
  flex: 1;
  min-width: 0;
}

.global-search__item-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--foreground, #111827);
}

.global-search__item-desc {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.global-search__item-tags {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}

.global-search__tag {
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--muted, #f3f4f6);
  font-size: 11px;
  color: #6b7280;
}

.global-search__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 16px;
  color: #9ca3af;
  gap: 8px;
  font-size: 14px;
}

.global-search__suggestions {
  list-style: none;
  margin: 0;
  padding: 4px 0;
}

.global-search__suggestion-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  color: #6b7280;
}

.global-search__suggestion-item:hover {
  background: var(--hover, #f3f4f6);
}

.global-search__loading {
  display: flex;
  justify-content: center;
  padding: 24px;
  color: #9ca3af;
}
</style>
