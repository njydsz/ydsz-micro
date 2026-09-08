<script setup lang="ts">
import type { SearchItem } from "#/hooks/use-global-search";

import { computed, defineModel, nextTick, ref, watch } from "vue";

/** 受控显隐 */
const props = defineProps<{
  appNameLabels?: Record<string, string>;
  items: SearchItem[];
}>();
const visible = defineModel<boolean>("visible", { required: true });

const query = ref("");
const activeIndex = ref(0);
const inputRef = ref<HTMLInputElement | null>(null);
const placeholder = "搜索菜单、功能、操作... (⌘K)";

/** 搜索结果过滤 */
const results = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return [];
  return props.items
    .map((item) => {
      const titleIdx = item.title.toLowerCase().indexOf(q);
      const descIdx = item.description?.toLowerCase().indexOf(q) ?? -1;
      if (titleIdx === -1 && descIdx < 0) return null;
      const qIdx = titleIdx === -1 ? descIdx : titleIdx;
      const highlightedTitle = `${item.title.slice(
        0,
        qIdx,
      )}<mark>${item.title.slice(qIdx, qIdx + q.length)}</mark>${item.title.slice(
        qIdx + q.length,
      )}`;
      return { ...item, highlightedTitle };
    })
    .filter((x): x is SearchItem & { highlightedTitle: string } => x !== null)
    .slice(0, 30);
});

watch(visible, async (v) => {
  if (v) {
    await nextTick();
    inputRef.value?.focus();
    query.value = "";
    activeIndex.value = 0;
  }
});

watch(query, () => {
  activeIndex.value = 0;
});

function navigate(dir: number) {
  const len = results.value.length;
  if (!len) return;
  activeIndex.value = (activeIndex.value + dir + len) % len;
}

function handleEnter() {
  const item = results.value[activeIndex.value];
  if (item) goTo(item);
}

function goTo(item: SearchItem) {
  close();
  if (item.onClick) item.onClick();
  else if (item.path) emitRouterPush(item.path);
}

function emitRouterPush(path: string) {
  window.dispatchEvent(
    new CustomEvent("micro-kernel:navigate", { detail: { path } }),
  );
}

function close() {
  visible.value = false;
}
// v4.0: cmd+k 快捷键由 App.vue 通过 useKeyboard 中枢统一注册，避免重复
</script>

<template>
  <Transition name="search-modal">
    <div
      v-if="visible"
      class="gs-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="全局搜索"
      @click.self="close"
      @keydown.esc="close"
    >
      <div class="gs-panel" role="search">
        <!-- 输入框 -->
        <div class="gs-input-wrap">
          <LucideIcon name="lucide:search" :size="18" class="gs-icon" />
          <input
            ref="inputRef"
            v-model="query"
            class="gs-input"
            :placeholder="placeholder"
            aria-label="搜索"
            @keydown.enter="handleEnter"
            @keydown.up.prevent="navigate(-1)"
            @keydown.down.prevent="navigate(1)"
          />
          <kbd class="gs-kbd">Esc</kbd>
        </div>

        <!-- 结果列表 -->
        <div class="gs-results" role="listbox">
          <template v-if="results.length > 0">
            <button
              v-for="(item, idx) in results"
              :key="item.id"
              class="gs-item"
              :class="{ 'is-active': idx === activeIndex }"
              role="option"
              :aria-selected="idx === activeIndex"
              @click="goTo(item)"
              @mouseenter="activeIndex = idx"
            >
              <LucideIcon
                :name="item.icon || 'lucide:file'"
                :size="14"
                class="gs-item-icon"
              />
              <div class="gs-item-body">
                <span
                  class="gs-item-title"
                  v-safe-html="item.highlightedTitle || item.title"
                ></span>
                <span class="gs-item-desc" v-if="item.description">{{
                  item.description
                }}</span>
              </div>
              <span class="gs-app-badge" :class="`is-${item.appName}`">{{
                item.appLabel
              }}</span>
            </button>
          </template>
          <div v-else-if="query.length > 0" class="gs-empty">未找到匹配项</div>
          <div v-else class="gs-tips">
            <span>↑↓ 选择</span><span>↵ 跳转</span><span>Esc 关闭</span>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.gs-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15vh;
  background: hsl(var(--bg-overlay));
}

.gs-panel {
  width: 560px;
  max-width: 90vw;
  background: hsl(var(--bg-glass));
  backdrop-filter: var(--backdrop-blur);
  border: 1px solid hsl(var(--glass-border));
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-overlay-200);
  overflow: hidden;
  animation: fade-in-down var(--duration-default) var(--ease-out) forwards;
}

.gs-input-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-inline);
  padding: 14px 16px;
  border-bottom: 1px solid hsl(var(--border-subtle));
}

.gs-icon {
  color: hsl(var(--txt-tertiary));
  flex-shrink: 0;
}

.gs-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: var(--text-15);
  background: transparent;
  color: hsl(var(--txt-primary));
}

.gs-input::placeholder {
  color: hsl(var(--txt-tertiary));
}

.gs-kbd {
  padding: var(--space-tight) var(--space-inline);
  font-size: var(--text-11);
  color: hsl(var(--txt-tertiary));
  background: hsl(var(--bg-surface-3));
  border-radius: var(--radius-xs);
  border: 1px solid hsl(var(--border-default));
  flex-shrink: 0;
}

.gs-results {
  max-height: 420px;
  overflow-y: auto;
  padding: 8px 0;
}

.gs-item {
  display: flex;
  align-items: center;
  gap: var(--space-inline);
  padding: var(--space-inline) 16px;
  cursor: pointer;
  border: none;
  background: transparent;
  width: 100%;
  text-align: left;
  border-bottom: 1px solid hsl(var(--border-subtle));
  border-left: 2px solid transparent;
  transition: var(--transition-colors);
}

.gs-item:last-child {
  border-bottom: none;
}

.gs-item.is-active {
  background: hsl(var(--row-active-bg));
  border-left: 2px solid hsl(var(--row-active-border));
}

.gs-item:hover {
  background: hsl(var(--row-hover-bg));
  border-left-color: transparent;
}

.gs-item-icon {
  color: var(--el-text-color-placeholder);
}

.gs-item-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.gs-item-title {
  font-size: var(--text-13);
  color: hsl(var(--txt-primary));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gs-item-title :deep(mark) {
  background: hsl(var(--primary-subtle));
  color: hsl(var(--primary));
  border-radius: var(--radius-xs);
  padding: 0 var(--space-tight);
}

.gs-item-desc {
  font-size: var(--text-11);
  color: hsl(var(--txt-secondary));
}

.gs-app-badge {
  padding: var(--space-tight) var(--space-inline);
  border-radius: var(--radius-full);
  font-size: var(--text-10);
  background: hsl(var(--bg-surface-3));
  color: hsl(var(--txt-secondary));
  white-space: nowrap;
  flex-shrink: 0;
}

.gs-empty,
.gs-tips {
  text-align: center;
  padding: var(--space-section) var(--space-group);
  font-size: var(--text-12);
  color: hsl(var(--txt-tertiary));
}

.gs-tips {
  display: flex;
  gap: var(--space-group);
  justify-content: center;
}

.search-modal-enter-active {
  transition: opacity var(--duration-fast) var(--ease-out);
}

.search-modal-enter-active .gs-panel {
  animation: fade-in-down var(--duration-default) var(--ease-spring) forwards;
}

.search-modal-leave-active {
  transition: opacity var(--duration-fast) var(--ease-in);
  animation: fade-out var(--duration-fast) var(--ease-in) forwards;
}

.search-modal-enter-from,
.search-modal-leave-to {
  opacity: 0;
}
</style>
