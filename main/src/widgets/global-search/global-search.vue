<!--
 * 全局搜索挂件 —— 顶栏搜索入口
 *
 * 两种展示状态：
 * 1. 显示搜索热词（后端接口可用时）
 * 2. 显示用户搜索历史（无热词时兜底）
 *
 * 点击打开命令面板对话框（search-panel.vue），键盘 Cmd+K 由
 * use-command-palette 统一处理。
 *
 * @path main\src\widgets\global-search\global-search.vue
 * @author ydsz-team
 * @since 5.1.0
-->
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';

import { useDebounceFn } from '@vueuse/core';

import { $t } from '@ydsz/locales';

import { useSearchStore } from '#/store/search';
import { useCommandPalette } from '#/composables/use-command-palette';
import { getHotSearches } from '#/api/search';

// ==================== State ====================

const searchStore = useSearchStore();
const searchVisible = ref(false);

/** 搜索热词 */
const hotWords = ref<string[]>([]);

/** 旋转索引（用于轮换显示热词） */
const hotWordIndex = ref(0);

// ==================== Computed ====================

/** 当前展示的热词（轮换） */
const displayHotWord = computed(() => {
  if (hotWords.value.length === 0) return '';
  return hotWords.value[hotWordIndex.value % hotWords.value.length];
});

/** 输入框占位符：有热词则轮换显示，否则显示默认文案 */
const placeholder = computed(() => {
  if (displayHotWord.value) {
    return `${$t('main.search.hotPrefix')}: ${displayHotWord.value}`;
  }
  return $t('main.search.placeholder');
});

// ==================== 键盘快捷键 ====================

const { open: openPanel } = useCommandPalette({
  visible: searchVisible,
});

// ==================== 操作 ====================

/** 点击挂件打开搜索面板 */
function handleClick() {
  openPanel();
}

/** 防抖 300ms */
const debouncedAction = useDebounceFn(() => {
  // 预留：可用于 telemetry 埋点
}, 300);

function handleEnter() {
  debouncedAction();
  openPanel();
}

// ==================== 热词轮播 ====================

let hotWordTimer: ReturnType<typeof setInterval> | null = null;

function startHotWordRotation() {
  if (hotWords.value.length <= 1) return;
  hotWordTimer = setInterval(() => {
    hotWordIndex.value = (hotWordIndex.value + 1) % hotWords.value.length;
  }, 3000);
}

function stopHotWordRotation() {
  if (hotWordTimer) {
    clearInterval(hotWordTimer);
    hotWordTimer = null;
  }
}

// ==================== Lifecycle ====================

onMounted(async () => {
  // 异步加载热词
  try {
    const words = await getHotSearches(5);
    hotWords.value = words;
    startHotWordRotation();
  } catch {
    // 静默失败
  }
});

onUnmounted(() => {
  stopHotWordRotation();
});
</script>

<template>
  <div class="gs-widget" @click="handleClick">
    <!-- 搜索图标 -->
    <LucideIcon name="lucide:search" :size="16" class="gs-widget-icon" />

    <!-- 展示区 -->
    <div class="gs-widget-body">
      <!-- 有热词时：显示热词 -->
      <span v-if="displayHotWord" class="gs-widget-hot">
        {{ $t('main.search.hotLabel') }}:
        <span class="gs-widget-hot-word">{{ displayHotWord }}</span>
      </span>
      <!-- 无热词时：显示历史记录 or 默认占位符 -->
      <span v-else-if="searchStore.recentSearches.length > 0" class="gs-widget-history">
        {{ $t('main.search.recentLabel') }}:
        <span class="gs-widget-history-word">
          {{ searchStore.recentSearches[0] }}
        </span>
      </span>
      <!-- 兜底占位符 -->
      <span v-else class="gs-widget-placeholder">
        {{ placeholder }}
      </span>
    </div>

    <!-- 快捷键标签 -->
    <kbd class="gs-widget-kbd">⌘K</kbd>
  </div>

  <!-- 搜索面板对话框 -->
  <SearchPanel v-model:visible="searchVisible" />
</template>

<style scoped>
.gs-widget {
  display: flex;
  align-items: center;
  gap: var(--space-inline);
  padding: 6px 12px;
  min-width: 220px;
  max-width: 320px;
  height: 36px;
  border-radius: var(--radius-full);
  background: hsl(var(--bg-surface-2));
  border: 1px solid hsl(var(--border-subtle));
  cursor: pointer;
  transition: var(--transition-colors);
  user-select: none;
}

.gs-widget:hover {
  border-color: hsl(var(--border-default));
  background: hsl(var(--bg-surface-3));
}

.gs-widget-icon {
  color: hsl(var(--txt-tertiary));
  flex-shrink: 0;
}

.gs-widget-body {
  flex: 1;
  font-size: var(--text-13);
  color: hsl(var(--txt-tertiary));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.gs-widget-hot-word,
.gs-widget-history-word {
  color: hsl(var(--txt-primary));
}

.gs-widget-placeholder {
  color: hsl(var(--txt-disabled));
}

.gs-widget-kbd {
  padding: 2px 6px;
  font-size: var(--text-10);
  color: hsl(var(--txt-tertiary));
  background: hsl(var(--bg-surface-1));
  border-radius: var(--radius-xs);
  border: 1px solid hsl(var(--border-default));
  flex-shrink: 0;
}
</style>
