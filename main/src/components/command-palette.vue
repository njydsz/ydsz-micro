<!--
 * Command Palette — 命令面板，对标 VS Code Ctrl+Shift+P
 *
 * 增强版全局搜索，支持：
 * 1. 搜索菜单/页面（⌘K 保持兼容）
 * 2. 执行命令/操作（⌘⇧P 切换模式）
 * 3. 最近访问记录
 * 4. 应用级命令注册
 *
 * @path main/src/components/command-palette.vue
 * @author ydsz-team
 * @since 4.0.0
-->
<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';

import type { SearchItem } from '@/hooks/use-global-search';
import {
  useSearchProviderStatus,
  SEARCH_PROVIDER_READY_EVENT,
  SEARCH_PROVIDER_COUNT_EVENT,
} from '@/hooks/use-global-search';
import type { SearchProviderReadyDetail } from '@/hooks/use-global-search';
import { getPreloadManager } from '@ydsz/micro-kernel/preload-strategy';

// ==================== 类型定义 ====================

type PaletteMode = 'search' | 'command';

interface CommandItem {
  id: string;
  title: string;
  category?: string;
  icon?: string;
  shortcut?: string;
  appName?: string;
  action: () => void | Promise<void>;
}

interface RecentItem {
  id: string;
  title: string;
  path: string;
  appName: string;
  timestamp: number;
}

// ==================== Props & Model ====================

const props = defineProps<{
  items: SearchItem[];
  appNameLabels?: Record<string, string>;
}>();

const visible = defineModel<boolean>('visible', { default: false });
const mode = defineModel<PaletteMode>('mode', { default: 'search' });

// ==================== State ====================

const query = ref('');
const activeIndex = ref(0);
const inputRef = ref<HTMLInputElement | null>(null);

// 命令注册表
const commands = ref<Map<string, CommandItem[]>>(new Map());
// 最近访问（最多20条）
const recentItems = ref<RecentItem[]>([]);
const RECENT_STORAGE_KEY = 'ydsz_command_palette_recent';
const MAX_RECENT = 20;

// P2-2: 搜索提供者就绪状态
const { providerCount: searchProviderCount, appNames: searchProviderNames } = useSearchProviderStatus();

// ==================== Computed ====================

/** 搜索结果 */
const searchResults = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return [];
  return props.items
    .map((item) => {
      const titleIdx = item.title.toLowerCase().indexOf(q);
      const descIdx = item.description?.toLowerCase().indexOf(q) ?? -1;
      if (titleIdx < 0 && descIdx < 0) return null;
      const qIdx = titleIdx >= 0 ? titleIdx : descIdx;
      const highlightedTitle =
        item.title.slice(0, qIdx) +
        `<mark>${item.title.slice(qIdx, qIdx + q.length)}</mark>` +
        item.title.slice(qIdx + q.length);
      return { ...item, highlightedTitle, _kind: 'search' as const };
    })
    .filter((x): x is SearchItem & { highlightedTitle: string; _kind: 'search' } => x !== null)
    .slice(0, 20);
});

/** 命令结果 */
const commandResults = computed(() => {
  const q = query.value.trim().toLowerCase();
  const allCommands: (CommandItem & { _kind: 'command' })[] = [];

  for (const [, cmds] of commands.value) {
    for (const cmd of cmds) {
      if (!q || cmd.title.toLowerCase().includes(q) || cmd.category?.toLowerCase().includes(q)) {
        allCommands.push({ ...cmd, _kind: 'command' });
      }
    }
  }

  return allCommands.slice(0, 20);
});

/** 最近访问 */
const recentResults = computed((): (RecentItem & { _kind: 'recent' })[] => {
  if (query.value.trim()) return [];
  return recentItems.value.slice(0, 5).map((r) => ({ ...r, _kind: 'recent' as const }));
});

/** 综合结果 */
const results = computed(() => {
  if (mode.value === 'command') return commandResults.value;
  return [...recentResults.value, ...searchResults.value];
});

/** 占位符文本 */
const placeholder = computed(() => {
  if (mode.value === 'command') return '输入命令... (⌘⇧P)';
  return '搜索菜单、功能、操作... (⌘K)';
});

/** P2-2: 搜索提供者状态栏文案 */
const searchProviderStatus = computed(() => {
  const count = searchProviderCount.value;
  if (count === 0) return '暂无搜索数据源';
  return `已加载 ${count} 个数据源${searchProviderNames.value.length > 0 ? ` · ${searchProviderNames.value.slice(0, 3).join(', ')}${count > 3 ? '…' : ''}` : ''}`;
});

// ==================== Methods ====================

function navigate(dir: number) {
  const len = results.value.length;
  if (!len) return;
  activeIndex.value = (activeIndex.value + dir + len) % len;
}

function handleEnter() {
  const item = results.value[activeIndex.value];
  if (!item) return;

  if (item._kind === 'command') {
    close();
    item.action();
  } else if (item._kind === 'recent') {
    close();
    window.dispatchEvent(new CustomEvent('micro-kernel:navigate', { detail: { path: item.path } }));
  } else {
    close();
    if (item.onClick) item.onClick();
    else if (item.path) {
      recordRecentAccess(item);
      window.dispatchEvent(new CustomEvent('micro-kernel:navigate', { detail: { path: item.path } }));
    }
  }
}

function close() {
  visible.value = false;
}

function toggleMode() {
  mode.value = mode.value === 'search' ? 'command' : 'search';
  query.value = '';
  activeIndex.value = 0;
  nextTick(() => inputRef.value?.focus());
}

/** 记录最近访问 */
function recordRecentAccess(item: SearchItem) {
  if (!item.path) return;
  const existing = recentItems.value.findIndex((r) => r.path === item.path);
  if (existing >= 0) recentItems.value.splice(existing, 1);

  recentItems.value.unshift({
    id: item.id,
    title: item.title,
    path: item.path,
    appName: item.appName,
    timestamp: Date.now(),
  });

  recentItems.value = recentItems.value.slice(0, MAX_RECENT);
  saveRecentItems();
}

/** 注册命令 */
function registerCommands(appName: string, cmds: CommandItem[]) {
  commands.value.set(appName, cmds);
}

/** 取消注册命令 */
function unregisterCommands(appName: string) {
  commands.value.delete(appName);
}

/** 加载最近访问 */
function loadRecentItems() {
  try {
    const data = localStorage.getItem(RECENT_STORAGE_KEY);
    if (data) recentItems.value = JSON.parse(data);
  } catch {
    // 静默
  }
}

/** 保存最近访问 */
function saveRecentItems() {
  try {
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(recentItems.value));
  } catch {
    // 静默
  }
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
});

watch(mode, () => {
  nextTick(() => inputRef.value?.focus());
});

// ==================== Lifecycle ====================

onMounted(() => {
  loadRecentItems();

  // 监听子应用命令注册事件
  window.addEventListener('YDSZ:register-commands', ((e: CustomEvent) => {
    const { appName, commands: cmds } = e.detail;
    registerCommands(appName, cmds);
  }) as EventListener);

  window.addEventListener('YDSZ:unregister-commands', ((e: CustomEvent) => {
    unregisterCommands(e.detail.appName);
  }) as EventListener);
});

onUnmounted(() => {
  window.removeEventListener('YDSZ:register-commands', () => {});
  window.removeEventListener('YDSZ:unregister-commands', () => {});
});

// ==================== Expose ====================

defineExpose({
  registerCommands,
  unregisterCommands,
  toggleMode,
  open: () => { visible.value = true; },
  close,
});
</script>

<template>
  <Transition name="palette-modal">
    <div
      v-if="visible"
      class="cp-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="命令面板"
      @click.self="close"
      @keydown.esc="close"
    >
      <div class="cp-panel" role="application">
        <!-- 模式切换标签 -->
        <div class="cp-tabs" role="tablist">
          <button
            class="cp-tab"
            role="tab"
            :aria-selected="mode === 'search'"
            :class="{ 'is-active': mode === 'search' }"
            @click="mode = 'search'; nextTick(() => inputRef?.focus())"
          >
            <span class="cp-tab-icon">🔍</span>
            <span>搜索</span>
            <kbd>⌘K</kbd>
          </button>
          <button
            class="cp-tab"
            role="tab"
            :aria-selected="mode === 'command'"
            :class="{ 'is-active': mode === 'command' }"
            @click="mode = 'command'; nextTick(() => inputRef?.focus())"
          >
            <span class="cp-tab-icon">⚡</span>
            <span>命令</span>
            <kbd>⌘⇧P</kbd>
          </button>
        </div>

        <!-- 输入框 -->
        <div class="cp-input-wrap">
          <span class="cp-input-icon">⌕</span>
          <input
            ref="inputRef"
            v-model="query"
            class="cp-input"
            :aria-label="placeholder"
            :placeholder="placeholder"
            @keydown.enter="handleEnter"
            @keydown.up.prevent="navigate(-1)"
            @keydown.down.prevent="navigate(1)"
          />
          <button class="cp-mode-btn" @click="toggleMode" title="切换模式">
            {{ mode === 'search' ? '⌘⇧P' : '⌘K' }}
          </button>
        </div>

        <!-- 结果区 -->
        <div class="cp-results" role="listbox">
          <!-- 最近访问 -->
          <template v-if="mode === 'search' && recentResults.length && !query.trim()">
            <div class="cp-section-title" role="presentation">最近访问</div>
            <button
              v-for="(item, idx) in recentResults"
              :key="'recent-' + item.id"
              class="cp-item cp-item-recent"
              :class="{ 'is-active': idx === activeIndex }"
              role="option"
              :aria-selected="idx === activeIndex"
              @click="activeIndex = idx; handleEnter()"
              @mouseenter="activeIndex = idx"
            >
              <span class="cp-item-icon cp-item-icon-recent">🕒</span>
              <div class="cp-item-body">
                <span class="cp-item-title">{{ item.title }}</span>
                <span class="cp-item-desc">{{ appNameLabels?.[item.appName] || item.appName }}</span>
              </div>
              <span class="cp-app-badge">{{ appNameLabels?.[item.appName] || item.appName }}</span>
            </button>
          </template>

          <!-- 搜索结果 -->
          <template v-if="mode === 'search'">
            <div v-if="query.trim() && searchResults.length" class="cp-section-title" role="presentation">搜索结果</div>
            <button
              v-for="(item, idx) in searchResults"
              :key="'search-' + item.id"
              class="cp-item"
              :class="{ 'is-active': (mode === 'search' ? recentResults.length : 0) + idx === activeIndex }"
              role="option"
              :aria-selected="(mode === 'search' ? recentResults.length : 0) + idx === activeIndex"
              @click="activeIndex = (mode === 'search' ? recentResults.length : 0) + idx; handleEnter()"
              @mouseenter="activeIndex = (mode === 'search' ? recentResults.length : 0) + idx"
            >
              <span class="cp-item-icon" v-if="item.icon" v-html="''" aria-hidden="true">
                <i :class="item.icon"></i>
              </span>
              <span class="cp-item-icon" v-else>📄</span>
              <div class="cp-item-body">
                <span class="cp-item-title" v-html="item.highlightedTitle || item.title"></span>
                <span class="cp-item-desc" v-if="item.description">{{ item.description }}</span>
              </div>
              <span class="cp-app-badge">{{ appNameLabels?.[item.appName] || item.appName }}</span>
            </button>
            <div v-if="query.trim() && !searchResults.length" class="cp-empty">
              <span>未找到匹配的菜单或页面</span>
              <span class="cp-empty-hint">试试其他关键词</span>
            </div>
          </template>

          <!-- 命令结果 -->
          <template v-if="mode === 'command'">
            <template v-if="commandResults.length">
              <div
                v-for="category in [...new Set(commandResults.map(c => c.category || '其他'))]"
                :key="category"
              >
                <div class="cp-section-title" role="presentation">{{ category }}</div>
                <button
                  v-for="cmd in commandResults.filter(c => (c.category || '其他') === category)"
                  :key="'cmd-' + cmd.id"
                  class="cp-item"
                  :class="{ 'is-active': commandResults.indexOf(cmd) === activeIndex }"
                  role="option"
                  :aria-selected="commandResults.indexOf(cmd) === activeIndex"
                  @click="activeIndex = commandResults.indexOf(cmd); handleEnter()"
                  @mouseenter="activeIndex = commandResults.indexOf(cmd)"
                >
                  <span class="cp-item-icon">{{ cmd.icon || '⚡' }}</span>
                  <div class="cp-item-body">
                    <span class="cp-item-title">{{ cmd.title }}</span>
                  </div>
                  <kbd v-if="cmd.shortcut" class="cp-shortcut">{{ cmd.shortcut }}</kbd>
                </button>
              </div>
            </template>
            <div v-else-if="query.trim()" class="cp-empty">未找到匹配的命令</div>
            <div v-else class="cp-empty">
              <span>可用命令</span>
              <span class="cp-empty-hint">已注册 {{ commandResults.length }} 个命令</span>
            </div>
          </template>

          <!-- 空状态 -->
          <div v-if="!results.length && !query.trim() && mode === 'search'" class="cp-tips">
            <span>↑↓ 选择</span><span>↵ 确认</span><span>Esc 关闭</span><span class="cp-tips-sep">|</span>
            <span><kbd>⌘K</kbd> 搜索</span><span><kbd>⌘⇧P</kbd> 命令</span>
          </div>
        </div>

        <!-- 底部工具栏 -->
        <div class="cp-footer">
          <span class="cp-footer-hint">
            ⌘K 搜索 · ⌘⇧P 命令 · ↵ 确认 · Esc 关闭
          </span>
          <!-- P2-2: 搜索提供者就绪状态 -->
          <span
            v-if="mode === 'search'"
            class="cp-footer-provider-status"
            :class="{ 'is-ready': searchProviderCount > 0 }"
            :title="`已注册搜索数据源: ${searchProviderNames.join(', ')}`"
          >
            <span class="cp-footer-dot" />
            {{ searchProviderStatus }}
          </span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* ============ Overlay ============ */
.cp-overlay {
  position: fixed; inset: 0; z-index: 99999;
  display: flex; align-items: flex-start; justify-content: center; padding-top: 12vh;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
}

/* ============ Panel ============ */
.cp-panel {
  width: 600px; max-width: 92vw;
  background: var(--el-bg-color, #fff);
  border-radius: 14px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.2), 0 0 0 1px var(--el-border-color-extra-light);
  overflow: hidden;
  display: flex; flex-direction: column;
  max-height: 70vh;
}

/* ============ Tabs ============ */
.cp-tabs {
  display: flex; gap: 4px;
  padding: 8px 8px 0;
  background: var(--el-fill-color-extra-light);
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.cp-tab {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 12px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  background: transparent;
  border: none;
  border-radius: 6px 6px 0 0;
  cursor: pointer;
}
.cp-tab:hover { background: var(--el-fill-color-light); color: var(--el-text-color-primary); }
.cp-tab.is-active {
  background: var(--el-bg-color);
  color: var(--el-color-primary);
  font-weight: 500;
}
.cp-tab-icon { font-size: 14px; }
.cp-tab kbd {
  font-size: 10px; padding: 1px 4px;
  background: var(--el-fill-color);
  border: 1px solid var(--el-border-color);
  border-radius: 3px;
}

/* ============ Input ============ */
.cp-input-wrap {
  display: flex; align-items: center; gap: 8px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.cp-input-icon { font-size: 18px; color: var(--el-text-color-placeholder); }
.cp-input {
  flex: 1; border: none; outline: none;
  font-size: 15px; background: transparent;
  color: var(--el-text-color-primary);
}
.cp-input::placeholder { color: var(--el-text-color-placeholder); }
.cp-mode-btn {
  font-size: 11px; padding: 3px 8px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  cursor: pointer;
}
.cp-mode-btn:hover { border-color: var(--el-color-primary); color: var(--el-color-primary); }

/* ============ Results ============ */
.cp-results { flex: 1; overflow-y: auto; padding: 8px 0; }

.cp-section-title {
  padding: 6px 16px 4px;
  font-size: 10px; font-weight: 600;
  color: var(--el-text-color-placeholder);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.cp-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 16px;
  cursor: pointer;
  border: none; background: transparent; width: 100%; text-align: left;
  transition: background 0.1s;
}
.cp-item:last-child { border-bottom: none; }
.cp-item.is-active, .cp-item:hover { background: var(--el-fill-color-light); }
.cp-item-icon { width: 18px; text-align: center; font-size: 14px; opacity: 0.7; }
.cp-item-icon-recent { font-size: 13px; }
.cp-item-body { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.cp-item-title { font-size: 13px; color: var(--el-text-color-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cp-item-title :deep(mark) { background: var(--el-color-primary-light-8); color: var(--el-color-primary); border-radius: 2px; padding: 0 2px; }
.cp-item-desc { font-size: 11px; color: var(--el-text-color-secondary); }
.cp-app-badge {
  padding: 2px 8px; border-radius: 10px;
  font-size: 10px; background: var(--el-fill-color-light);
  color: var(--el-text-color-regular); white-space: nowrap;
}
.cp-shortcut {
  padding: 2px 6px;
  font-size: 11px;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color);
  border: 1px solid var(--el-border-color);
  border-radius: 3px;
}

/* ============ Empty & Tips ============ */
.cp-empty { text-align: center; padding: 24px 16px; color: var(--el-text-color-placeholder); }
.cp-empty span { display: block; font-size: 13px; }
.cp-empty-hint { font-size: 11px !important; margin-top: 4px; opacity: 0.7; }

.cp-tips {
  display: flex; gap: 10px; justify-content: center;
  padding: 16px;
  font-size: 11px; color: var(--el-text-color-placeholder);
}
.cp-tips kbd {
  padding: 1px 4px; font-size: 10px;
  background: var(--el-fill-color);
  border: 1px solid var(--el-border-color);
  border-radius: 3px;
}
.cp-tips-sep { opacity: 0.5; }

/* ============ Footer ============ */
.cp-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 16px;
  border-top: 1px solid var(--el-border-color-extra-light);
  background: var(--el-fill-color-extra-light);
}
.cp-footer-hint {
  font-size: 10px;
  color: var(--el-text-color-placeholder);
}
/* P2-2: 搜索提供者状态指示 */
.cp-footer-provider-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
}
.cp-footer-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-color-warning);
  flex-shrink: 0;
}
.cp-footer-provider-status.is-ready .cp-footer-dot {
  background: var(--el-color-success);
}
.cp-footer-provider-status.is-ready {
  color: var(--el-text-color-regular);
}

/* ============ Transitions ============ */
.palette-modal-enter-active, .palette-modal-leave-active { transition: opacity 0.15s ease; }
.palette-modal-enter-from, .palette-modal-leave-to { opacity: 0; }
</style>
