<!--
 * 全局搜索面板组件 —— 跨子应用搜索中心（双 Tab：功能导航 + 全部搜索）
 *
 * 基于 use-command-palette 处理 Cmd+K 快捷键，
 * 集成搜索 Store 管理查询状态与历史，
 * 底部菜单：Esc 关闭 / ↑↓ 选择 / Enter 跳转。
 *
 * v5.2: 搜索空态增加「快速创建」入口（8 个动作 + 数字键 1-8 快捷键）；
 *       Redisette 风格斜杠命令：/lock、/theme、/goto 等 8 内置命令。
 *       面板高自适应 max-h-[60vh] overflow-y-auto。
 *
 * @path main\src\widgets\global-search\search-panel.vue
 * @author ydsz-team
 * @since 5.1.0
-->
<script setup lang="ts">
import type { SearchResultItem } from '#/api/search';
import type { SearchItem } from '#/hooks/use-global-search';

import { computed, nextTick, ref, watch } from 'vue';

import { useDebounceFn } from '@vueuse/core';

import { $t } from '@ydsz/locales';

import { useSearchStore } from '#/store/search';
import {
  useGlobalSearch,
} from '#/hooks/use-global-search';
import { useSlashCommands } from '#/composables/use-slash-commands';

/** 面板内部统一的结果项类型 */
type PanelResultItem = SearchResultItem & {
  /** 高亮后的标题 HTML */
  highlightedTitle?: string;
  /** 来源标识 */
  _kind: 'nav' | 'api';
};

/** 快速创建动作类型 */
interface QuickCreateAction {
  /** 动作标题 i18n key */
  titleKey: string;
  /** 描述 i18n key */
  descKey: string;
  /** 图标名 (lucide:xxx) */
  icon: string;
  /** 数字键 1-8 */
  numKey: number;
  /** 跳转路径或 null 则走事件 */
  path?: string;
  /** 自定义事件名（path 为空时触发） */
  eventName?: string;
}

// ==================== Props & Model ====================

const visible = defineModel<boolean>('visible', { required: true });

// ==================== Store ====================

const searchStore = useSearchStore();
const { items: providerItems, appNameLabels } = useGlobalSearch();

// ==================== State ====================

type TabKey = 'navigation' | 'all';
const activeTab = ref<TabKey>('navigation');
const query = ref('');
const activeIndex = ref(0);
const inputRef = ref<HTMLInputElement | null>(null);

// ==================== 斜杠命令 ====================

const slashCtx = {
  closePanel: () => close(),
};
const {
  parsed: slashResult,
  isSlashCommand,
  currentCommandName,
} = useSlashCommands(query, slashCtx);

// ==================== 快速创建（8 个常用动作） ====================

const QUICK_CREATE_ACTIONS: readonly QuickCreateAction[] = [
  {
    titleKey: 'main.quickCreate.newTicket',
    descKey: 'main.quickCreate.newTicketDesc',
    icon: 'lucide:ticket',
    numKey: 1,
    eventName: 'micro-kernel:quick-create-ticket',
  },
  {
    titleKey: 'main.quickCreate.newDocument',
    descKey: 'main.quickCreate.newDocumentDesc',
    icon: 'lucide:file-plus',
    numKey: 2,
    eventName: 'micro-kernel:quick-create-document',
  },
  {
    titleKey: 'main.quickCreate.newTask',
    descKey: 'main.quickCreate.newTaskDesc',
    icon: 'lucide:check-square',
    numKey: 3,
    eventName: 'micro-kernel:quick-create-task',
  },
  {
    titleKey: 'main.quickCreate.addUser',
    descKey: 'main.quickCreate.addUserDesc',
    icon: 'lucide:user-plus',
    numKey: 4,
    path: '/system/user/create',
  },
  {
    titleKey: 'main.quickCreate.viewNotifications',
    descKey: 'main.quickCreate.viewNotificationsDesc',
    icon: 'lucide:bell',
    numKey: 5,
    path: '/notifications',
  },
  {
    titleKey: 'main.quickCreate.lockScreen',
    descKey: 'main.quickCreate.lockScreenDesc',
    icon: 'lucide:lock',
    numKey: 6,
    eventName: 'micro-kernel:lock-screen',
  },
  {
    titleKey: 'main.quickCreate.submitFeedback',
    descKey: 'main.quickCreate.submitFeedbackDesc',
    icon: 'lucide:message-square',
    numKey: 7,
    eventName: 'micro-kernel:open-feedback',
  },
  {
    titleKey: 'main.quickCreate.settings',
    descKey: 'main.quickCreate.settingsDesc',
    icon: 'lucide:settings',
    numKey: 8,
    path: '/system/settings',
  },
] as const;

/** 数字键 → 动作的映射 */
const QUICK_ACTION_BY_NUM = new Map<number, QuickCreateAction>(
  QUICK_CREATE_ACTIONS.map((a) => [a.numKey, a]),
);

// ==================== Debounced Search ====================

/** 防抖 300ms 调用后端全文搜索 */
const debouncedSearch = useDebounceFn(() => {
  if (query.value.trim()) {
    searchStore.doSearch(query.value.trim());
  }
}, 300);

// ==================== Computed ====================

/** 功能导航 Tab：基于 providerItems 本地搜索过滤 */
const navResults = computed((): PanelResultItem[] => {
  const q = query.value.trim().toLowerCase();
  if (!q || q.startsWith('/')) return [];
  return providerItems.value
    .map((item): PanelResultItem | null => {
      const titleIdx = item.title.toLowerCase().indexOf(q);
      const descIdx = item.description?.toLowerCase().indexOf(q) ?? -1;
      if (titleIdx === -1 && descIdx < 0) return null;
      const highlightedTitle = highlightMatch(item.title, q);
      return {
        id: item.id,
        title: item.title,
        description: item.description,
        url: item.path,
        category: 'page',
        appName: item.appName,
        icon: item.icon,
        highlightedTitle,
        _kind: 'nav',
      };
    })
    .filter((x): x is PanelResultItem => x !== null)
    .slice(0, 15);
});

/** 全部搜索 Tab：基于后端结果 + 本地 provider 合并 */
const allResults = computed((): PanelResultItem[] => {
  const q = query.value.trim();
  if (!q || q.startsWith('/')) return [];
  return searchStore.results.map((item) => ({
    ...item,
    _kind: 'api' as const,
  }));
});

/** 当前 Tab 下的结果列表 */
const results = computed(() => {
  return activeTab.value === 'navigation' ? navResults.value : allResults.value;
});

/** 是否斜杠命令模式 */
const inSlashMode = computed(() => isSlashCommand.value && activeTab.value === 'navigation');

/** 是否显示快速创建（navigation tab 且无结果且无斜杠命令且正在输入词） */
const showQuickCreate = computed(
  () =>
    activeTab.value === 'navigation' &&
    !inSlashMode.value &&
    navResults.value.length === 0 &&
    query.value.trim().length > 0 &&
    !query.value.trim().startsWith('/'),
);

/** 是否显示斜杠命令中（正在输入 /xxx） */
const showSlashHint = computed(() => inSlashMode.value);

/** 底部快捷键提示 */
const footerHints = computed(() => {
  const hints: string[] = [$t('main.search.hintNavigate'), $t('main.search.hintConfirm'), $t('main.search.hintClose')];
  if (inSlashMode.value) {
    hints.push($t('main.search.hintSlashEnter'));
  }
  return hints;
});

// ==================== Helpers ====================

function highlightMatch(text: string, query: string): string {
  const idx = text.toLowerCase().indexOf(query);
  if (idx === -1) return text;
  return `${text.slice(0, idx)}<mark>${text.slice(idx, idx + query.length)}</mark>${text.slice(idx + query.length)}`;
}

function navigate(dir: number) {
  const len = results.value.length;
  if (!len) return;
  activeIndex.value = (activeIndex.value + dir + len) % len;
}

/**
 * 处理 Enter 键
 * - 斜杠命令模式：执行命令
 * - 常规模式：跳转到激活项
 */
async function handleEnter() {
  if (inSlashMode.value) {
    await handleSlashEnter();
    return;
  }
  const item = results.value[activeIndex.value];
  if (item) goTo(item);
}

async function handleSlashEnter() {
  if (slashResult.value) {
    await slashResult.value.command.action(slashResult.value.args, slashCtx);
  }
}

function goTo(item: PanelResultItem) {
  close();
  if (item.url) {
    window.dispatchEvent(
      new CustomEvent('micro-kernel:navigate', { detail: { path: item.url } }),
    );
  }
}

/**
 * 执行快速创建动作
 */
function executeQuickAction(action: QuickCreateAction) {
  close();
  if (action.path) {
    window.dispatchEvent(
      new CustomEvent('micro-kernel:navigate', { detail: { path: action.path } }),
    );
  } else if (action.eventName) {
    window.dispatchEvent(new CustomEvent(action.eventName));
  }
}

/**
 * 处理数字键 1-8（仅快速创建区域可见时）
 */
function handleQuickKey(key: string) {
  if (!showQuickCreate.value) return;
  const num = Number.parseInt(key, 10);
  if (Number.isNaN(num)) return;
  const action = QUICK_ACTION_BY_NUM.get(num);
  if (action) executeQuickAction(action);
}

function close() {
  visible.value = false;
}

// ==================== Watchers ====================

watch(visible, async (v) => {
  if (v) {
    await nextTick();
    inputRef.value?.focus();
    query.value = '';
    activeIndex.value = 0;
  }
});

watch(query, () => {
  activeIndex.value = 0;
  if (activeTab.value === 'all') {
    debouncedSearch();
  }
});

watch(activeTab, () => {
  activeIndex.value = 0;
  query.value = '';
});
</script>

<template>
  <Transition name="search-modal">
    <div
      v-if="visible"
      class="gs-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="全局搜索面板"
      @click.self="close"
      @keydown.esc="close"
    >
      <div class="gs-panel" role="search">
        <!-- Tab 切换 -->
        <div class="gs-tabs" role="tablist">
          <button
            class="gs-tab"
            role="tab"
            :aria-selected="activeTab === 'navigation'"
            :class="{ 'is-active': activeTab === 'navigation' }"
            @click="activeTab = 'navigation'"
          >
            {{ $t('main.search.tabNavigation') }}
          </button>
          <button
            class="gs-tab"
            role="tab"
            :aria-selected="activeTab === 'all'"
            :class="{ 'is-active': activeTab === 'all' }"
            @click="activeTab = 'all'"
          >
            {{ $t('main.search.tabAllSearch') }}
          </button>
        </div>

        <!-- 输入框 -->
        <div class="gs-input-wrap">
          <LucideIcon
            :name="inSlashMode ? 'lucide:terminal' : 'lucide:search'"
            :size="18"
            class="gs-icon"
          />
          <input
            ref="inputRef"
            v-model="query"
            class="gs-input"
            :placeholder="
              inSlashMode
                ? $t('main.search.slashModePlaceholder')
                : $t('main.search.placeholder')
            "
            aria-label="搜索"
            @keydown.enter="handleEnter"
            @keydown.up.prevent="navigate(-1)"
            @keydown.down.prevent="navigate(1)"
            @keydown.1="handleQuickKey('1')"
            @keydown.2="handleQuickKey('2')"
            @keydown.3="handleQuickKey('3')"
            @keydown.4="handleQuickKey('4')"
            @keydown.5="handleQuickKey('5')"
            @keydown.6="handleQuickKey('6')"
            @keydown.7="handleQuickKey('7')"
            @keydown.8="handleQuickKey('8')"
          />
          <kbd class="gs-kbd">Esc</kbd>
        </div>

        <!-- Loading -->
        <div v-if="searchStore.loading && activeTab === 'all'" class="gs-loading">
          <LucideIcon name="lucide:loader-2" :size="16" class="gs-loading-icon" />
          {{ $t('main.search.loading') }}
        </div>

        <!-- 结果列表（viewport-aware, max-h-[60vh]） -->
        <div class="gs-results" role="listbox">
          <!-- ========== 斜杠命令匹配状态 ========== -->
          <template v-if="showSlashHint">
            <div class="gs-slash-hint">
              <div class="gs-slash-hint-bar">
                <LucideIcon name="lucide:terminal" :size="14" class="gs-slash-cmd-icon" />
                <span class="gs-slash-cmd-name">/{{ currentCommandName }}</span>
                <span class="gs-slash-cmd-desc">
                  {{ slashResult?.description }}
                </span>
              </div>
              <div class="gs-slash-hint-params">
                <span v-if="slashResult && slashResult.args.length > 0" class="gs-slash-args">
                  {{ $t('main.slashCmd.args') }}: {{ slashResult.args.join(' ') }}
                </span>
                <span v-else class="gs-slash-tip">
                  {{ $t('main.slashCmd.tip.' + currentCommandName) }}
                </span>
              </div>
            </div>
          </template>

          <!-- ========== 搜索结果条目 ========== -->
          <template v-else-if="results.length > 0">
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
                <span v-if="item.description" class="gs-item-desc">{{
                  item.description
                }}</span>
              </div>
              <span class="gs-app-badge">{{
                (item.appName && appNameLabels?.[item.appName]) || item.categoryLabel || item.category
              }}</span>
            </button>
          </template>

          <!-- ========== 快速创建（navigation tab 无结果且有搜索词时） ========== -->
          <template v-else-if="showQuickCreate">
            <div class="gs-quick-create">
              <div class="gs-qc-header">
                <LucideIcon name="lucide:zap" :size="14" class="gs-qc-icon" />
                <span class="gs-qc-title">{{ $t('main.quickCreate.title') }}</span>
              </div>
              <div class="gs-qc-grid">
                <button
                  v-for="action in QUICK_CREATE_ACTIONS"
                  :key="action.numKey"
                  class="gs-qc-action"
                  @click="executeQuickAction(action)"
                >
                  <span class="gs-qc-action-num">{{ action.numKey }}</span>
                  <LucideIcon :name="action.icon" :size="16" class="gs-qc-action-icon" />
                  <div class="gs-qc-action-body">
                    <span class="gs-qc-action-title">{{ $t(action.titleKey) }}</span>
                    <span class="gs-qc-action-desc">{{ $t(action.descKey) }}</span>
                  </div>
                </button>
              </div>
            </div>
          </template>

          <!-- ========== 空状态：有搜索词但无结果（非 navigation tab） ========== -->
          <div v-else-if="query.trim().length > 0 && !searchStore.loading" class="gs-empty">
            {{ $t('main.search.noResults') }}
          </div>

          <!-- ========== 空状态：无搜索词 → 显示引导 ========== -->
          <div v-else class="gs-tips">
            <span>{{ $t('main.search.emptyTip') }}</span>
          </div>
        </div>

        <!-- 底部快捷键提示 -->
        <div class="gs-footer">
          <span v-for="hint in footerHints" :key="hint" class="gs-footer-hint">
            {{ hint }}
          </span>
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
  width: 580px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  background: hsl(var(--bg-glass));
  backdrop-filter: var(--backdrop-blur);
  border: 1px solid hsl(var(--glass-border));
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-overlay-200);
  overflow: hidden;
  animation: fade-in-down var(--duration-default) var(--ease-out) forwards;
}

.gs-tabs {
  display: flex;
  flex-shrink: 0;
  border-bottom: 1px solid hsl(var(--border-subtle));
}

.gs-tab {
  flex: 1;
  padding: 12px 16px;
  font-size: var(--text-13);
  color: hsl(var(--txt-secondary));
  background: transparent;
  border: none;
  cursor: pointer;
  transition: var(--transition-colors);
  border-bottom: 2px solid transparent;
}

.gs-tab:hover {
  color: hsl(var(--txt-primary));
  background: hsl(var(--bg-surface-1));
}

.gs-tab.is-active {
  color: hsl(var(--primary));
  border-bottom-color: hsl(var(--primary));
}

.gs-input-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-inline);
  flex-shrink: 0;
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

.gs-loading {
  display: flex;
  align-items: center;
  gap: var(--space-inline);
  flex-shrink: 0;
  padding: 16px;
  font-size: var(--text-12);
  color: hsl(var(--txt-tertiary));
}

.gs-loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ==================== 搜索结果区（viewport-aware 自适应） ==================== */

.gs-results {
  flex: 1 1 auto;
  min-height: 0;
  max-height: 60vh;
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
  color: hsl(var(--txt-disabled));
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

/* ==================== 斜杠命令提示 ==================== */

.gs-slash-hint {
  padding: 12px 16px;
}

.gs-slash-hint-bar {
  display: flex;
  align-items: center;
  gap: var(--space-inline);
  margin-bottom: var(--space-tight);
}

.gs-slash-cmd-icon {
  color: hsl(var(--primary));
  flex-shrink: 0;
}

.gs-slash-cmd-name {
  font-size: var(--text-13);
  font-weight: 600;
  color: hsl(var(--txt-primary));
}

.gs-slash-cmd-desc {
  font-size: var(--text-12);
  color: hsl(var(--txt-secondary));
}

.gs-slash-hint-params {
  font-size: var(--text-11);
  color: hsl(var(--txt-tertiary));
}

.gs-slash-args {
  font-family: var(--font-family-code, monospace);
}

.gs-slash-tip {
  font-style: italic;
}

/* ==================== 快速创建网格 ==================== */

.gs-quick-create {
  padding: 12px 16px;
}

.gs-qc-header {
  display: flex;
  align-items: center;
  gap: var(--space-inline);
  margin-bottom: 10px;
}

.gs-qc-icon {
  color: hsl(var(--warning, 48 96% 53%));
}

.gs-qc-title {
  font-size: var(--text-12);
  font-weight: 600;
  color: hsl(var(--txt-secondary));
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.gs-qc-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

.gs-qc-action {
  display: flex;
  align-items: center;
  gap: var(--space-inline);
  padding: 8px 10px;
  background: hsl(var(--bg-surface-1));
  border: 1px solid hsl(var(--border-subtle));
  border-radius: var(--radius-md);
  cursor: pointer;
  text-align: left;
  transition: var(--transition-colors);
}

.gs-qc-action:hover {
  background: hsl(var(--bg-surface-2));
  border-color: hsl(var(--border-default));
}

.gs-qc-action-num {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  font-size: var(--text-10);
  font-weight: 600;
  color: hsl(var(--txt-tertiary));
  background: hsl(var(--bg-surface-3));
  border-radius: var(--radius-xs);
  flex-shrink: 0;
}

.gs-qc-action-icon {
  color: hsl(var(--primary));
  flex-shrink: 0;
}

.gs-qc-action-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.gs-qc-action-title {
  font-size: var(--text-12);
  color: hsl(var(--txt-primary));
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gs-qc-action-desc {
  font-size: var(--text-10);
  color: hsl(var(--txt-tertiary));
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ==================== 空状态 ==================== */

.gs-empty,
.gs-tips {
  text-align: center;
  padding: var(--space-section) var(--space-group);
  font-size: var(--text-12);
  color: hsl(var(--txt-tertiary));
}

/* ==================== 底部 ==================== */

.gs-footer {
  display: flex;
  gap: var(--space-group);
  justify-content: center;
  flex-shrink: 0;
  padding: 10px 16px;
  border-top: 1px solid hsl(var(--border-subtle));
}

.gs-footer-hint {
  font-size: var(--text-11);
  color: hsl(var(--txt-disabled));
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
