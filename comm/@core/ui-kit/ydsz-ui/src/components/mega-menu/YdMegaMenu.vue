/**
 * YdMegaMenu —— 大型菜单组件。
 *
 * 受 Azure / Office ribbon menu 启发的大型菜单：顶部一条横栏，
 * 点击任意一项展开多列子菜单面板，每列含一个标题与若干条目。
 *
 * WAI-ARIA: 顶部导航 role="menubar"，子面板 role="menu"，条目 role="menuitem"。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\mega-menu\YdMegaMenu.vue
 * @author ydsz-team
 * @since 1.0.0
 */
<script setup lang="ts">
import { computed, ref } from 'vue';

import type { MegaMenuSubItem, YdMegaMenuEmits, YdMegaMenuProps } from './types';

defineOptions({ name: 'YdMegaMenu' });

const props = withDefaults(defineProps<YdMegaMenuProps>(), {
  items: () => [],
  orientation: 'horizontal',
});

const emit = defineEmits<YdMegaMenuEmits>();

/** 当前激活的顶级项索引，-1 表示未激活 */
const activeIndex = ref(-1);

/** 是否已展开子面板 */
const isOpen = computed(() => activeIndex.value >= 0);

function openSubmenu(index: number): void {
  activeIndex.value = index;
}

function closeSubmenu(): void {
  activeIndex.value = -1;
}

function onItemClick(item: MegaMenuSubItem): void {
  item.command?.();
  emit('command', item);
  closeSubmenu();
}

function onTopItemCommand(index: number): void {
  const topItem = props.items[index];
  if (!topItem) return;
  topItem.command?.();
  // 顶级项有自己的 command 时触发后不打开子面板
}

function onKeydown(e: KeyboardEvent): void {
  if (!isOpen.value) return;
  const len = props.items.length;
  if (len === 0) return;

  switch (e.key) {
    case 'Escape':
      e.preventDefault();
      closeSubmenu();
      break;
    case 'ArrowRight':
      e.preventDefault();
      activeIndex.value = (activeIndex.value + 1) % len;
      break;
    case 'ArrowLeft':
      e.preventDefault();
      activeIndex.value = (activeIndex.value - 1 + len) % len;
      break;
  }
}
</script>

<template>
  <div
    class="yd-mega-menu"
    :class="{
      'yd-mega-menu--horizontal': orientation === 'horizontal',
      'yd-mega-menu--vertical': orientation === 'vertical',
      'yd-mega-menu--open': isOpen,
    }"
    @keydown="onKeydown"
    @mouseleave="closeSubmenu"
  >
    <!-- 顶部导航 -->
    <nav
      class="yd-mega-menu__bar"
      role="menubar"
      :aria-orientation="orientation"
    >
      <button
        v-for="(item, idx) in items"
        :key="idx"
        type="button"
        role="menuitem"
        class="yd-mega-menu__top-item"
        :class="{ 'yd-mega-menu__top-item--active': activeIndex === idx }"
        :aria-expanded="activeIndex === idx"
        :aria-haspopup="item.items.length > 0"
        @mouseenter="openSubmenu(idx)"
        @click="onTopItemCommand(idx)"
      >
        <span
          v-if="item.icon"
          class="yd-mega-menu__top-icon"
          aria-hidden="true"
        >
          {{ item.icon }}
        </span>
        <span class="yd-mega-menu__top-label">{{ item.label }}</span>
        <svg
          v-if="item.items.length > 0"
          class="yd-mega-menu__top-arrow"
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 4L5 6L7 4"
            stroke="currentColor"
            stroke-width="1.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </nav>

    <!-- 展开面板 -->
    <Transition name="yd-mega-menu-panel">
      <div
        v-if="isOpen && items[activeIndex]?.items.length"
        class="yd-mega-menu__panel"
        role="menu"
        :aria-label="items[activeIndex]?.label"
      >
        <!-- 背景遮罩（vertical 模式不需要） -->
        <div
          v-if="orientation === 'horizontal'"
          class="yd-mega-menu__panel-bg"
          @click="closeSubmenu"
        />

        <div class="yd-mega-menu__panel-content">
          <div
            v-for="(col, colIdx) in items[activeIndex]?.items ?? []"
            :key="colIdx"
            class="yd-mega-menu__column"
          >
            <div class="yd-mega-menu__column-title">
              {{ col.title }}
            </div>

            <button
              v-for="(sub, subIdx) in col.items"
              :key="subIdx"
              type="button"
              role="menuitem"
              class="yd-mega-menu__sub-item"
              @click="onItemClick(sub)"
            >
              <span
                v-if="sub.icon"
                class="yd-mega-menu__sub-icon"
                aria-hidden="true"
              >
                {{ sub.icon }}
              </span>
              <span class="yd-mega-menu__sub-label">{{ sub.label }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.yd-mega-menu {
  position: relative;
}

/* —— 导航条 —— */
.yd-mega-menu__bar {
  display: flex;
  gap: 0;
  border-bottom: 1px solid hsl(var(--ydsz-border-subtle));
}

.yd-mega-menu--vertical .yd-mega-menu__bar {
  flex-direction: column;
  border-bottom: none;
  border-right: 1px solid hsl(var(--ydsz-border-subtle));
}

.yd-mega-menu__top-item {
  display: inline-flex;
  align-items: center;
  gap: var(--ydsz-spacing-xs);
  padding: var(--ydsz-spacing-sm) var(--ydsz-spacing-md);
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: var(--ydsz-font-size-sm);
  color: hsl(var(--ydsz-text-secondary));
  border-radius: var(--ydsz-radius-md) var(--ydsz-radius-md) 0 0;
  transition: color 0.15s ease, background 0.15s ease;
  white-space: nowrap;
}

.yd-mega-menu--vertical .yd-mega-menu__top-item {
  border-radius: var(--ydsz-radius-md) 0 0 var(--ydsz-radius-md);
  justify-content: flex-start;
  width: 100%;
}

.yd-mega-menu__top-item:hover {
  color: hsl(var(--ydsz-text-primary));
  background: hsl(var(--ydsz-surface-2));
}

.yd-mega-menu__top-item--active {
  color: hsl(var(--ydsz-comp-bg));
  background: hsl(var(--ydsz-surface-2));
}

.yd-mega-menu__top-icon {
  color: hsl(var(--ydsz-text-tertiary));
}

.yd-mega-menu__top-arrow {
  transition: transform 0.15s ease;
  color: hsl(var(--ydsz-text-tertiary));
}

.yd-mega-menu__top-item--active .yd-mega-menu__top-arrow {
  transform: rotate(180deg);
}

/* —— 展开面板 —— */
.yd-mega-menu__panel {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 100;
}

.yd-mega-menu--vertical .yd-mega-menu__panel {
  top: 0;
  left: 100%;
  right: auto;
}

.yd-mega-menu__panel-bg {
  position: fixed;
  inset: 0;
  z-index: -1;
  cursor: default;
}

.yd-mega-menu__panel-content {
  display: flex;
  gap: var(--ydsz-spacing-xl);
  padding: var(--ydsz-spacing-lg) var(--ydsz-spacing-xl);
  background: hsl(var(--ydsz-surface-1));
  border: 1px solid hsl(var(--ydsz-border-default));
  border-top: none;
  border-radius: 0 0 var(--ydsz-radius-lg) var(--ydsz-radius-lg);
  box-shadow: var(--ydsz-shadow-lg);
  flex-wrap: wrap;
}

.yd-mega-menu--vertical .yd-mega-menu__panel-content {
  border: 1px solid hsl(var(--ydsz-border-default));
  border-left: none;
  border-radius: 0 var(--ydsz-radius-lg) var(--ydsz-radius-lg) 0;
}

/* —— 列 —— */
.yd-mega-menu__column {
  display: flex;
  flex-direction: column;
  min-width: 140px;
  flex: 0 0 auto;
}

.yd-mega-menu__column-title {
  font-size: var(--ydsz-font-size-xs);
  font-weight: 600;
  color: hsl(var(--ydsz-text-tertiary));
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: var(--ydsz-spacing-xs) var(--ydsz-spacing-xs) var(--ydsz-spacing-xxs);
  margin-bottom: var(--ydsz-spacing-xxs);
  border-bottom: 1px solid hsl(var(--ydsz-border-subtle));
}

/* —— 子菜单条目 —— */
.yd-mega-menu__sub-item {
  display: flex;
  align-items: center;
  gap: var(--ydsz-spacing-xs);
  padding: var(--ydsz-spacing-xs) var(--ydsz-spacing-xs);
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: var(--ydsz-font-size-sm);
  color: hsl(var(--ydsz-text-primary));
  text-align: left;
  border-radius: var(--ydsz-radius-md);
  transition: background 0.1s ease;
  white-space: nowrap;
}

.yd-mega-menu__sub-item:hover {
  background: hsl(var(--ydsz-surface-2));
}

.yd-mega-menu__sub-icon {
  color: hsl(var(--ydsz-text-tertiary));
  flex-shrink: 0;
}

.yd-mega-menu__sub-label {
  flex: 1;
}

/* —— 过渡 —— */
.yd-mega-menu-panel-enter-active,
.yd-mega-menu-panel-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.yd-mega-menu-panel-enter-from,
.yd-mega-menu-panel-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.yd-mega-menu--vertical .yd-mega-menu-panel-enter-from,
.yd-mega-menu--vertical .yd-mega-menu-panel-leave-to {
  opacity: 0;
  transform: translateX(-4px);
}
</style>
