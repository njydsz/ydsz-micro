<script setup lang="ts">
/**
 * YdSidebar - sidebar navigation component.
 *
 * Supports nested submenus, accordion mode, collapsed/expanded, icons + text + badges,
 * keyboard navigation, ARIA tree structure.
 *
 * WAI-ARIA: role="tree" (container) + role="treeitem" (each item)
 * + aria-expanded / aria-selected / aria-level etc.
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\sidebar\YdSidebar.vue
 * @author ydsz-team
 * @since 1.0.0
 */

import { ref } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import SidebarMenuItem from './SidebarMenuItem.vue';
import type { SidebarItem, YdSidebarEmits, YdSidebarProps } from './types';

defineOptions({ name: 'YdSidebar' });

const props = withDefaults(defineProps<YdSidebarProps>(), {
  accordion: false,
  activeKey: '',
  collapsed: false,
  items: () => [],
  width: 240,
  collapsedWidth: 64,
});

const emit = defineEmits<YdSidebarEmits>();

/** Current active item key */
const activeKey = ref(props.activeKey);

/** Current expanded submenu keys */
const expandedKeys = ref<Set<string>>(new Set());

/** Accordion mode: currently expanded top-level key */
const accordionExpandedKey = ref<string | undefined>(undefined);

/* ============================================================ */
/* Methods                                                        */
/* ============================================================ */

/**
 * Check if an item has visible children.
 */
function hasChildren(item: SidebarItem): boolean {
  return Array.isArray(item.children) && item.children.length > 0;
}

/**
 * Select menu item (called when any item at any level is clicked).
 */
function selectItem(item: SidebarItem): void {
  if (item.disabled) return;
  activeKey.value = item.key;
  emit('update:activeKey', item.key);
  emit('select', item);
}

/**
 * Toggle submenu expand/collapse.
 */
function toggleExpand(item: SidebarItem): void {
  if (!hasChildren(item)) return;

  if (props.accordion) {
    accordionExpandedKey.value =
      accordionExpandedKey.value === item.key ? undefined : item.key;
    emit(
      'expand-change',
      accordionExpandedKey.value ? [accordionExpandedKey.value] : [],
    );
  } else {
    const next = new Set(expandedKeys.value);
    if (next.has(item.key)) {
      next.delete(item.key);
    } else {
      next.add(item.key);
    }
    expandedKeys.value = next;
    emit('expand-change', Array.from(next));
  }
}

/**
 * Handle item click - dispatched from any nested level.
 * The 'select' event carries the actual clicked item.
 */
function handleSelect(item: SidebarItem): void {
  selectItem(item);
}

function handleExpandToggle(item: SidebarItem): void {
  toggleExpand(item);
}

function findItem(items: SidebarItem[], key: string): SidebarItem | undefined {
  for (const item of items) {
    if (item.key === key) return item;
    if (hasChildren(item)) {
      const child = findItem(item.children!, key);
      if (child) return child;
    }
  }
  return undefined;
}

defineExpose({
  activeKey,
  expandedKeys,
  select: (key: string) => {
    const found = findItem(props.items, key);
    if (found) selectItem(found);
  },
});
</script>

<template>
  <nav
    :class="
      cn(
        'yd-sidebar flex h-full flex-col overflow-hidden',
        'bg-[hsl(var(--ydsz-surface-3))] border-r border-[hsl(var(--ydsz-border-subtle))]',
        'transition-[width] duration-300',
      )
    "
    :style="{
      width: props.collapsed
        ? (typeof props.collapsedWidth === 'number' ? `${props.collapsedWidth}px` : props.collapsedWidth)
        : (typeof props.width === 'number' ? `${props.width}px` : props.width),
    }"
    role="tree"
    aria-label="Sidebar navigation"
    aria-orientation="vertical"
  >
    <div class="flex-1 overflow-y-auto overflow-x-hidden py-2">
      <ul
        v-if="props.items.length > 0"
        role="group"
        class="flex flex-col gap-0.5"
      >
        <li
          v-for="item in props.items"
          :key="item.key"
          role="none"
        >
          <SidebarMenuItem
            :item="item"
            :level="0"
            :collapsed="props.collapsed"
            :active-key="activeKey"
            :expanded-keys="Array.from(expandedKeys)"
            :accordion="props.accordion"
            :accordion-expanded-key="accordionExpandedKey"
            @select="handleSelect"
            @expand="handleExpandToggle"
          />
        </li>
      </ul>

      <p
        v-else
        class="px-4 py-8 text-center text-sm text-[hsl(var(--ydsz-text-tertiary))]"
      >
        No menu items
      </p>
    </div>
  </nav>
</template>

<style scoped>
.yd-sidebar {
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--ydsz-border-default)) transparent;
}

.yd-sidebar > div::-webkit-scrollbar {
  width: 4px;
}

.yd-sidebar > div::-webkit-scrollbar-thumb {
  background: hsl(var(--ydsz-border-default));
  border-radius: 2px;
}
</style>
