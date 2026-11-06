<!--
 * 快捷键帮助面板 —— 按 ? 键打开，展示所有已注册的全局快捷键
 *
 * 使用居中对话框式展示，内容来源自 use-global-shortcut 注册表的
 * description/category 元数据。
 *
 * @path main\src\components\keyboard-help.vue
 * @author ydsz-team
 * @since 5.3.0
-->
<script setup lang="ts">
import { computed } from 'vue';

import { CATEGORY_LABELS, listDetailedShortcuts } from '#/hooks/use-global-shortcut';
import { isHelpVisible } from '#/composables/use-keyboard';

// ─── 数据 ───────────────────────────────────────────────────────

const shortcuts = computed(() => listDetailedShortcuts());

/**
 * 按分类分组，保持分类顺序
 */
const groupedShortcuts = computed(() => {
  const order: Array<'navigation' | 'editing' | 'system' | 'app'> = [
    'navigation',
    'editing',
    'system',
    'app',
  ];
  const groups = new Map<string, typeof shortcuts.value>();

  for (const s of shortcuts.value) {
    const list = groups.get(s.category) ?? [];
    list.push(s);
    groups.set(s.category, list);
  }

  return order
    .filter((cat) => groups.has(cat))
    .map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat],
      items: groups.get(cat)!,
    }));
});

/**
 * 平台对应的修饰键文本
 */
const platformHint = computed(() => {
  const isMac = navigator.platform.toUpperCase().includes('MAC');
  return isMac ? '按 ⇧?（Shift + /）打开此面板' : '按 ?（Shift + /）打开此面板';
});

/**
 * 关闭帮助面板
 */
function close(): void {
  isHelpVisible.value = false;
}

/**
 * Esc 在面板内按下时关闭
 */
function onPanelKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    e.stopPropagation();
    close();
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="kh-overlay">
      <div
        v-if="isHelpVisible"
        class="kh-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="快捷键帮助面板"
        @click.self="close"
      >
        <div class="kh-panel" @keydown="onPanelKeydown">
          <!-- 标题区 -->
          <header class="kh-header">
            <h2 class="kh-title">
              <span class="kh-title-icon" aria-hidden="true">⌨</span>
              键盘快捷键
            </h2>
            <p class="kh-platform-hint">{{ platformHint }}</p>
            <button class="kh-close-btn" aria-label="关闭快捷键帮助" @click="close">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M4 4l8 8M12 4l-8 8"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          </header>

          <!-- 快捷键列表 -->
          <div class="kh-body">
            <template v-if="shortcuts.length === 0">
              <div class="kh-empty">
                <span class="kh-empty-icon" aria-hidden="true">⌨</span>
                <p>暂无已注册的快捷键</p>
              </div>
            </template>

            <template v-for="group in groupedShortcuts" :key="group.category">
              <section class="kh-group">
                <h3 class="kh-group-title">{{ group.label }}</h3>
                <ul class="kh-list" role="list">
                  <li v-for="item in group.items" :key="item.combo" class="kh-item">
                    <span class="kh-item-desc">{{ item.description || '（未描述）' }}</span>
                    <kbd class="kh-kbd" :title="item.combo">
                      <kbd
                        v-for="(part, idx) in item.displayText.split(' + ')"
                        :key="idx"
                        class="kh-kbd-part"
                        >{{ part.trim() }}</kbd
                      >
                    </kbd>
                  </li>
                </ul>
              </section>
            </template>
          </div>

          <!-- 底部提示 -->
          <footer class="kh-footer">
            <span class="kh-footer-tip">
              按 <kbd class="kh-kbd-inline">Esc</kbd> 或点击空白处关闭
            </span>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ─── 遮罩 ────────────────────────────────────────────────────── */
.kh-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 8vh;
  background: hsl(var(--bg-overlay, 0 0% 0% / 0.5));
}

/* ─── 面板 ────────────────────────────────────────────────────── */
.kh-panel {
  width: 600px;
  max-width: 92vw;
  max-height: 78vh;
  display: flex;
  flex-direction: column;
  background: hsl(var(--bg-glass, 0 0% 100%));
  backdrop-filter: var(--backdrop-blur, blur(16px));
  border: 1px solid hsl(var(--glass-border, 0 0% 90%));
  border-radius: var(--radius-xl, 16px);
  box-shadow: var(--shadow-overlay-200);
  overflow: hidden;
  animation: kh-in var(--duration-default, 0.2s) var(--ease-spring, ease-out) forwards;
}

/* ─── 头部 ────────────────────────────────────────────────────── */
.kh-header {
  position: relative;
  padding: 20px 24px 12px;
  border-bottom: 1px solid hsl(var(--border-subtle, 0 0% 92%));
}

.kh-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: var(--text-16, 16px);
  font-weight: 600;
  color: hsl(var(--txt-primary, 0 0% 10%));
}

.kh-title-icon {
  font-size: 20px;
  line-height: 1;
}

.kh-platform-hint {
  margin: 4px 0 0;
  font-size: var(--text-11, 11px);
  color: hsl(var(--txt-tertiary, 0 0% 60%));
}

.kh-close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-sm, 6px);
  background: transparent;
  color: hsl(var(--txt-secondary, 0 0% 40%));
  cursor: pointer;
  transition: var(--transition-colors, 0.15s ease);
}

.kh-close-btn:hover {
  background: hsl(var(--bg-surface-3, 0 0% 95%));
  color: hsl(var(--txt-primary, 0 0% 10%));
}

/* ─── 内容区 ──────────────────────────────────────────────────── */
.kh-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
}

.kh-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 48px 0;
  text-align: center;
  color: hsl(var(--txt-tertiary, 0 0% 60%));
}

.kh-empty-icon {
  font-size: 32px;
  opacity: 0.5;
}

/* ─── 分组 ────────────────────────────────────────────────────── */
.kh-group + .kh-group {
  margin-top: 20px;
}

.kh-group-title {
  margin: 0 0 8px;
  font-size: var(--text-11, 11px);
  font-weight: 600;
  color: hsl(var(--txt-tertiary, 0 0% 60%));
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.kh-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.kh-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid hsl(var(--border-subtle, 0 0% 95%));
  gap: 12px;
}

.kh-item:last-child {
  border-bottom: none;
}

.kh-item-desc {
  font-size: var(--text-13, 13px);
  color: hsl(var(--txt-primary, 0 0% 10%));
  flex: 1;
  min-width: 0;
}

/* ─── Key display (kbd-style) ─────────────────────────────────── */
.kh-kbd {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
}

.kh-kbd-part {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 6px;
  font-family: var(--font-mono, 'JetBrains Mono', monospace);
  font-size: var(--text-11, 11px);
  font-weight: 500;
  line-height: 1;
  color: hsl(var(--txt-primary, 0 0% 10%));
  background: hsl(var(--bg-surface-3, 0 0% 95%));
  border: 1px solid hsl(var(--border-default, 0 0% 85%));
  border-bottom-width: 2px;
  border-radius: var(--radius-xs, 4px);
}

.kh-kbd-inline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 22px;
  padding: 0 6px;
  font-family: var(--font-mono, 'JetBrains Mono', monospace);
  font-size: var(--text-11, 11px);
  font-weight: 500;
  color: hsl(var(--txt-primary, 0 0% 10%));
  background: hsl(var(--bg-surface-3, 0 0% 95%));
  border: 1px solid hsl(var(--border-default, 0 0% 85%));
  border-bottom-width: 2px;
  border-radius: var(--radius-xs, 4px);
}

/* ─── Footer ──────────────────────────────────────────────────── */
.kh-footer {
  padding: 10px 24px;
  border-top: 1px solid hsl(var(--border-subtle, 0 0% 92%));
  text-align: center;
}

.kh-footer-tip {
  font-size: var(--text-11, 11px);
  color: hsl(var(--txt-tertiary, 0 0% 60%));
}

/* ─── Animation ───────────────────────────────────────────────── */
.kh-overlay-enter-active {
  transition: opacity var(--duration-fast, 0.15s) ease-out;
}

.kh-overlay-enter-active .kh-panel {
  animation: kh-in var(--duration-default, 0.25s)
    var(--ease-spring, cubic-bezier(0.34, 1.56, 0.64, 1)) forwards;
}

.kh-overlay-leave-active {
  transition: opacity var(--duration-fast, 0.15s) ease-in;
}

.kh-overlay-enter-from,
.kh-overlay-leave-to {
  opacity: 0;
}

@keyframes kh-in {
  from {
    opacity: 0;
    transform: translateY(-12px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
