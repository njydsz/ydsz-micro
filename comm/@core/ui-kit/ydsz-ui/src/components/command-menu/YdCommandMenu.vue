/**
 * YdCommandMenu —— 命令面板组件。
 *
 * 受 VS Code / Raycast 奎发的全屏模糊面板，输入框实时搜索过滤 + 上下键导航 + Enter 确认。
 *
 * WAI-ARIA: role="dialog" + aria-modal，搜索框 role="combobox"，列表 role="listbox"，选项 role="option"。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\command-menu\YdCommandMenu.vue
 * @author ydsz-team
 * @since 1.0.0
 */
<script setup lang="ts">
import {
  computed,
  nextTick,
  ref,
  useTemplateRef,
  watch,
} from 'vue';

import type { CommandItem, YdCommandMenuEmits, YdCommandMenuProps } from './types';

defineOptions({ name: 'YdCommandMenu' });

const props = withDefaults(defineProps<YdCommandMenuProps>(), {
  items: () => [],
  placeholder: 'Type a command...',
  emptyText: 'No results found.',
  open: false,
});

const emit = defineEmits<YdCommandMenuEmits>();

// —— 面板显隐 ——
const isVisible = ref(props.open);

watch(() => props.open, (val) => {
  isVisible.value = val;
  if (val) {
    searchQuery.value = '';
    activeIndex.value = 0;
    nextTick(() => inputRef.value?.focus());
  }
});

// —— 搜索过滤 ——
const searchQuery = ref('');
const activeIndex = ref(0);

/** 扁平化所有可执行的叶子节点 */
const flatItems = computed<CommandItem[]>(() => {
  const flat: CommandItem[] = [];
  function walk(items: CommandItem[]): void {
    for (const item of items) {
      if (item.children && item.children.length > 0) {
        walk(item.children);
      } else {
        flat.push(item);
      }
    }
  }
  walk(props.items);
  return flat;
});

/** 模糊匹配 */
function fuzzyMatch(text: string, query: string): boolean {
  if (!query) return true;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let qi = 0;
  for (let ti = 0; ti < lowerText.length && qi < lowerQuery.length; ti++) {
    if (lowerText[ti] === lowerQuery[qi]) qi++;
  }
  return qi === lowerQuery.length;
}

/** 过滤后的列表 */
const filteredItems = computed<CommandItem[]>(() => {
  if (!searchQuery.value) return flatItems.value;
  return flatItems.value.filter(
    (item) => !item.disabled && fuzzyMatch(item.label, searchQuery.value),
  );
});

watch(filteredItems, () => {
  activeIndex.value = 0;
});

// —— DOM refs ——
const inputRef = useTemplateRef<HTMLInputElement>('searchInput');
const listRef = useTemplateRef<HTMLElement>('commandList');

// —— 选中执行 ——
function selectItem(item: CommandItem): void {
  if (item.disabled) return;
  item.action();
  emit('select', item);
  close();
}

function close(): void {
  isVisible.value = false;
  emit('update:open', false);
}

// —— 键盘导航 ——
function onKeydown(e: KeyboardEvent): void {
  const items = filteredItems.value;
  if (items.length === 0) return;

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      activeIndex.value = (activeIndex.value + 1) % items.length;
      scrollIntoView();
      break;
    case 'ArrowUp':
      e.preventDefault();
      activeIndex.value = (activeIndex.value - 1 + items.length) % items.length;
      scrollIntoView();
      break;
    case 'Enter':
      e.preventDefault();
      {
        const item = items[activeIndex.value];
        if (item) {
          selectItem(item);
        }
      }
      break;
    case 'Escape':
      e.preventDefault();
      close();
      break;
  }
}

function scrollIntoView(): void {
  nextTick(() => {
    const list = listRef.value;
    if (!list) return;
    const active = list.children[activeIndex.value] as HTMLElement | undefined;
    active?.scrollIntoView({ block: 'nearest' });
  });
}
</script>

<template>
  <Teleport to="body">
    <Transition name="yd-command-menu">
      <div
        v-if="isVisible"
        class="yd-command-menu__overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Command Menu"
        @click.self="close"
      >
        <div class="yd-command-menu__panel">
          <!-- 搜索框 -->
          <div class="yd-command-menu__search">
            <svg
              class="yd-command-menu__search-icon"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="6.5"
                cy="6.5"
                r="5"
                stroke="currentColor"
                stroke-width="1.5"
              />
              <path
                d="M10.5 10.5L14 14"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>

            <input
              ref="searchInput"
              v-model="searchQuery"
              type="text"
              role="combobox"
              aria-expanded="true"
              aria-controls="yd-command-menu-list"
              aria-autocomplete="list"
              :placeholder="placeholder"
              class="yd-command-menu__input"
              @keydown="onKeydown"
            >
          </div>

          <!-- 结果列表 -->
          <div
            v-if="filteredItems.length > 0"
            id="yd-command-menu-list"
            ref="commandList"
            class="yd-command-menu__list"
            role="listbox"
          >
            <button
              v-for="(item, idx) in filteredItems"
              :key="item.id"
              type="button"
              role="option"
              :aria-selected="idx === activeIndex"
              class="yd-command-menu__item"
              :class="{
                'yd-command-menu__item--active': idx === activeIndex,
                'yd-command-menu__item--disabled': item.disabled,
              }"
              @click="selectItem(item)"
              @mouseenter="activeIndex = idx"
            >
              <span
                v-if="item.icon"
                class="yd-command-menu__item-icon"
                aria-hidden="true"
              >
                {{ item.icon }}
              </span>

              <span class="yd-command-menu__item-label">{{ item.label }}</span>

              <span
                v-if="item.shortcut?.length"
                class="yd-command-menu__item-shortcut"
              >
                <kbd
                  v-for="(key, ki) in item.shortcut"
                  :key="ki"
                  class="yd-command-menu__kbd"
                >{{ key }}</kbd>
              </span>
            </button>
          </div>

          <!-- 空状态 -->
          <div
            v-else
            class="yd-command-menu__empty"
            role="status"
            aria-live="polite"
          >
            {{ emptyText }}
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.yd-command-menu__overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15vh;
  background: hsl(var(--ydsz-overlay-bg) / 0.5);
  backdrop-filter: blur(4px);
}

.yd-command-menu__panel {
  width: 100%;
  max-width: 560px;
  background: hsl(var(--ydsz-surface-1));
  border: 1px solid hsl(var(--ydsz-border-default));
  border-radius: var(--ydsz-radius-xl);
  box-shadow: var(--ydsz-shadow-xl);
  overflow: hidden;
  box-sizing: border-box;
}

.yd-command-menu__search {
  display: flex;
  align-items: center;
  gap: var(--ydsz-spacing-sm);
  padding: var(--ydsz-spacing-md) var(--ydsz-spacing-lg);
  border-bottom: 1px solid hsl(var(--ydsz-border-subtle));
}

.yd-command-menu__search-icon {
  flex-shrink: 0;
  color: hsl(var(--ydsz-text-tertiary));
}

.yd-command-menu__input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: var(--ydsz-font-size-base);
  color: hsl(var(--ydsz-text-primary));
  min-width: 0;
}

.yd-command-menu__input::placeholder {
  color: hsl(var(--ydsz-text-tertiary));
}

.yd-command-menu__list {
  max-height: 320px;
  overflow-y: auto;
  padding: var(--ydsz-spacing-xs);
}

.yd-command-menu__item {
  display: flex;
  align-items: center;
  gap: var(--ydsz-spacing-sm);
  width: 100%;
  padding: var(--ydsz-spacing-xs) var(--ydsz-spacing-sm);
  border: none;
  background: transparent;
  border-radius: var(--ydsz-radius-md);
  cursor: pointer;
  font-size: var(--ydsz-font-size-sm);
  color: hsl(var(--ydsz-text-primary));
  text-align: left;
  transition: background 0.1s ease;
}

.yd-command-menu__item:hover,
.yd-command-menu__item--active {
  background: hsl(var(--ydsz-surface-2));
}

.yd-command-menu__item--active {
  color: hsl(var(--ydsz-comp-bg));
}

.yd-command-menu__item--disabled {
  opacity: 0.4;
  pointer-events: none;
}

.yd-command-menu__item-icon {
  flex-shrink: 0;
  width: 1.125rem;
  height: 1.125rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: hsl(var(--ydsz-text-tertiary));
}

.yd-command-menu__item-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.yd-command-menu__item-shortcut {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.yd-command-menu__kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.25rem;
  font-size: var(--ydsz-font-size-xs);
  font-family: var(--ydsz-font-mono);
  color: hsl(var(--ydsz-text-tertiary));
  background: hsl(var(--ydsz-surface-2));
  border: 1px solid hsl(var(--ydsz-border-default));
  border-radius: var(--ydsz-radius-sm);
}

.yd-command-menu__empty {
  padding: var(--ydsz-spacing-xl) var(--ydsz-spacing-lg);
  text-align: center;
  font-size: var(--ydsz-font-size-sm);
  color: hsl(var(--ydsz-text-tertiary));
}

/* 过渡动画 */
.yd-command-menu-enter-active,
.yd-command-menu-leave-active {
  transition: opacity 0.18s ease;
}

.yd-command-menu-enter-active .yd-command-menu__panel,
.yd-command-menu-leave-active .yd-command-menu__panel {
  transition: transform 0.18s ease, opacity 0.18s ease;
}

.yd-command-menu-enter-from,
.yd-command-menu-leave-to {
  opacity: 0;
}

.yd-command-menu-enter-from .yd-command-menu__panel,
.yd-command-menu-leave-to .yd-command-menu__panel {
  transform: translateY(-8px) scale(0.98);
  opacity: 0;
}
</style>
