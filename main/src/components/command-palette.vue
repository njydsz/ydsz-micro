<!--
 * Command Palette — 命令面板，对标 VS Code Ctrl+Shift+P
 *
 * 增强版全局搜索，支持：
 * 1. 搜索菜单/页面（⌘K 保持兼容）
 * 2. 执行命令/操作（⌘⇧P 切换模式）
 * 3. 最近访问记录
 * 4. 应用级命令注册
 *
 * 逻辑已提取至 composables：
 * - use-command-search.ts：搜索/命令过滤逻辑
 * - use-command-recent.ts：最近访问记录管理
 * - use-command-keyboard.ts：全局键盘快捷键
 *
 * 样式已提取至 command-palette.css
 *
 * @path main/src/components/command-palette.vue
 * @author ydsz-team
 * @since 4.0.0
-->
<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { $t } from "@ydsz/locales";

import { useSearchProviderStatus } from "#/hooks/use-global-search";
import type { SearchItem } from "#/hooks/use-global-search";

import {
  useCommandSearch,
  type CommandItem,
  type PaletteMode,
} from "./command-palette/composables/use-command-search";

import { useCommandRecent } from "./command-palette/composables/use-command-recent";
import { useCommandKeyboard } from "./command-palette/composables/use-command-keyboard";

// Props & Model
const props = defineProps<{
  appNameLabels?: Record<string, string>;
  items: SearchItem[];
}>();

const visible = defineModel<boolean>("visible", { default: false });
const mode = defineModel<PaletteMode>("mode", { default: "search" });

// State
const query = ref("");
const activeIndex = ref(0);
const inputRef = ref<HTMLInputElement | null>(null);
const commands = ref<Map<string, CommandItem[]>>(new Map());

// P2-2: 搜索提供者就绪状态
const { providerCount: searchProviderCount, appNames: searchProviderNames } =
  useSearchProviderStatus();

// Composables
const { recentItems, loadRecentItems, recordRecentAccess } = useCommandRecent();

const {
  searchResults,
  commandResults,
  recentResults,
  results,
  placeholder,
  searchProviderStatus,
  navigate,
  handleEnter,
} = useCommandSearch({
  query,
  mode,
  items: () => props.items,
  commands,
  recentItems,
  activeIndex,
  appNameLabels: () => props.appNameLabels,
  searchProviderCount,
  searchProviderNames,
  close,
  recordRecentAccess,
});

const { toggleMode: keyboardToggleMode } = useCommandKeyboard({
  onOpen: (m) => {
    mode.value = m;
    visible.value = true;
  },
  onClose: close,
  onToggleMode: () => {
    mode.value = mode.value === "search" ? "command" : "search";
  },
});

// Methods
function close() {
  visible.value = false;
}

function toggleMode() {
  keyboardToggleMode();
  query.value = "";
  activeIndex.value = 0;
  nextTick(() => inputRef.value?.focus());
}

function registerCommands(appName: string, cmds: CommandItem[]) {
  commands.value.set(appName, cmds);
}

function unregisterCommands(appName: string) {
  commands.value.delete(appName);
}

// Watchers
watch(visible, async (v) => {
  if (v) {
    await nextTick();
    inputRef.value?.focus();
    query.value = "";
    activeIndex.value = 0;
  }
});

watch(mode, () => {
  nextTick(() => inputRef.value?.focus());
});

// Lifecycle
function handleRegisterCommands(e: Event) {
  const { appName, commands: cmds } = (e as CustomEvent).detail;
  registerCommands(appName, cmds);
}

function handleUnregisterCommands(e: Event) {
  unregisterCommands((e as CustomEvent).detail.appName);
}

onMounted(() => {
  loadRecentItems();
  window.addEventListener("YDSZ:register-commands", handleRegisterCommands);
  window.addEventListener("YDSZ:unregister-commands", handleUnregisterCommands);
});

onUnmounted(() => {
  window.removeEventListener("YDSZ:register-commands", handleRegisterCommands);
  window.removeEventListener("YDSZ:unregister-commands", handleUnregisterCommands);
});

// Expose
defineExpose({
  registerCommands,
  unregisterCommands,
  toggleMode,
  open: () => {
    visible.value = true;
  },
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
      :aria-label="$t('page.commandPalette.ariaLabel')"
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
            @click="
              mode = 'search';
              nextTick(() => inputRef?.focus());
            "
          >
            <span class="cp-tab-icon">🔍</span>
            <span>{{ $t('page.commandPalette.search') }}</span>
            <kbd>⌘K</kbd>
          </button>
          <button
            class="cp-tab"
            role="tab"
            :aria-selected="mode === 'command'"
            :class="{ 'is-active': mode === 'command' }"
            @click="
              mode = 'command';
              nextTick(() => inputRef?.focus());
            "
          >
            <span class="cp-tab-icon">⚡</span>
            <span>{{ $t('page.commandPalette.command') }}</span>
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
          <button class="cp-mode-btn" @click="toggleMode" :title="$t('page.commandPalette.toggleMode')">
            {{ mode === "search" ? "⌘⇧P" : "⌘K" }}
          </button>
        </div>

        <!-- 结果区 -->
        <div class="cp-results" role="listbox">
          <!-- 最近访问 -->
          <template
            v-if="
              mode === 'search' && recentResults.length > 0 && !query.trim()
            "
          >
            <div class="cp-section-title" role="presentation">{{ $t('page.commandPalette.recent') }}</div>
            <button
              v-for="(item, idx) in recentResults"
              :key="`recent-${item.id}`"
              class="cp-item cp-item-recent"
              :class="{ 'is-active': idx === activeIndex }"
              role="option"
              :aria-selected="idx === activeIndex"
              @click="
                activeIndex = idx;
                handleEnter();
              "
              @mouseenter="activeIndex = idx"
            >
              <span class="cp-item-icon cp-item-icon-recent">🕒</span>
              <div class="cp-item-body">
                <span class="cp-item-title">{{ item.title }}</span>
                <span class="cp-item-desc">{{
                  appNameLabels?.[item.appName] || item.appName
                }}</span>
              </div>
              <span class="cp-app-badge">{{
                appNameLabels?.[item.appName] || item.appName
              }}</span>
            </button>
          </template>

          <!-- {{ $t('page.commandPalette.results') }} -->
          <template v-if="mode === 'search'">
            <div
              v-if="query.trim() && searchResults.length > 0"
              class="cp-section-title"
              role="presentation"
            >
              {{ $t('page.commandPalette.results') }}
            </div>
            <button
              v-for="(item, idx) in searchResults"
              :key="`search-${item.id}`"
              class="cp-item"
              :class="{
                'is-active':
                  (mode === 'search' ? recentResults.length : 0) + idx ===
                  activeIndex,
              }"
              role="option"
              :aria-selected="
                (mode === 'search' ? recentResults.length : 0) + idx ===
                activeIndex
              "
              @click="
                activeIndex =
                  (mode === 'search' ? recentResults.length : 0) + idx;
                handleEnter();
              "
              @mouseenter="
                activeIndex =
                  (mode === 'search' ? recentResults.length : 0) + idx
              "
            >
              <span
                class="cp-item-icon"
                v-if="item.icon"
                aria-hidden="true"
              >
                <i :class="item.icon"></i>
              </span>
              <span class="cp-item-icon" v-else>📄</span>
              <div class="cp-item-body">
                <span
                  class="cp-item-title"
                  v-safe-html="item.highlightedTitle || item.title"
                ></span>
                <span class="cp-item-desc" v-if="item.description">{{
                  item.description
                }}</span>
              </div>
              <span class="cp-app-badge">{{
                appNameLabels?.[item.appName] || item.appName
              }}</span>
            </button>
            <div
              v-if="query.trim() && searchResults.length === 0"
              class="cp-empty"
            >
              <span>{{ $t('page.commandPalette.noMenu') }}</span>
              <span class="cp-empty-hint">{{ $t('page.commandPalette.tryOtherKeywords') }}</span>
            </div>
          </template>

          <!-- 命令结果 -->
          <template v-if="mode === 'command'">
            <template v-if="commandResults.length > 0">
              <div
                v-for="category in [
                  ...new Set(commandResults.map((c) => c.category || $t('page.commandPalette.other'))),
                ]"
                :key="category"
              >
                <div class="cp-section-title" role="presentation">
                  {{ category }}
                </div>
                <button
                  v-for="cmd in commandResults.filter(
                    (c) => (c.category || $t('page.commandPalette.other')) === category,
                  )"
                  :key="`cmd-${cmd.id}`"
                  class="cp-item"
                  :class="{
                    'is-active': commandResults.indexOf(cmd) === activeIndex,
                  }"
                  role="option"
                  :aria-selected="commandResults.indexOf(cmd) === activeIndex"
                  @click="
                    activeIndex = commandResults.indexOf(cmd);
                    handleEnter();
                  "
                  @mouseenter="activeIndex = commandResults.indexOf(cmd)"
                >
                  <span class="cp-item-icon">{{ cmd.icon || "⚡" }}</span>
                  <div class="cp-item-body">
                    <span class="cp-item-title">{{ cmd.title }}</span>
                  </div>
                  <kbd v-if="cmd.shortcut" class="cp-shortcut">{{
                    cmd.shortcut
                  }}</kbd>
                </button>
              </div>
            </template>
            <div v-else-if="query.trim()" class="cp-empty">
              {{ $t('page.commandPalette.noCommand') }}
            </div>
            <div v-else class="cp-empty">
              <span>{{ $t('page.commandPalette.availableCommands') }}</span>
              <span class="cp-empty-hint">{{ $t('page.commandPalette.registeredCount', { count: commandResults.length }) }}</span>
            </div>
          </template>

          <!-- 空状态 -->
          <div
            v-if="results.length === 0 && !query.trim() && mode === 'search'"
            class="cp-tips"
          >
            <span>{{ $t('page.commandPalette.tipsNav') }}</span><span>{{ $t('page.commandPalette.tipsConfirm') }}</span><span>{{ $t('page.commandPalette.tipsClose') }}</span><span class="cp-tips-sep">|</span> <span><kbd>⌘K</kbd> {{ $t('page.commandPalette.search') }}</span><span><kbd>⌘⇧P</kbd> {{ $t('page.commandPalette.command') }}</span>
          </div>
        </div>

        <!-- 底部工具栏 -->
        <div class="cp-footer">
          <span class="cp-footer-hint">
            {{ $t('page.commandPalette.shortcutBar') }}
          </span>
          <span
            v-if="mode === 'search'"
            class="cp-footer-provider-status"
            :class="{ 'is-ready': searchProviderCount > 0 }"
            :title="$t('page.commandPalette.providerTitle', { names: searchProviderNames.join(', ') })"
          >
            <span class="cp-footer-dot"></span>
            {{ searchProviderStatus }}
          </span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped src="./command-palette/command-palette.css"></style>
