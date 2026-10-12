<script setup lang="ts">
/**
 * SidebarMenuItem - single sidebar menu item (recursive component).
 *
 * Renders icon + text + badge + expand arrow, recursively renders children.
 * In collapsed mode shows only icon with title attribute for hover tooltip.
 *
 * Uses bubbling events (@select, @expand) to communicate with the root YdSidebar.
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\sidebar\SidebarMenuItem.vue
 * @author ydsz-team
 * @since 1.0.0
 */

import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';
import { ChevronDown } from 'lucide-vue-next';

import { YdIcon } from '../icon';
import type { SidebarItem } from './types';

defineOptions({ name: 'SidebarMenuItem' });

const props = defineProps<{
  item: SidebarItem;
  level: number;
  collapsed: boolean;
  /** The globally active key */
  activeKey: string;
  /** Currently expanded keys (for non-accordion) */
  expandedKeys: string[];
  /** Whether accordion mode is on */
  accordion: boolean;
  /** Currently expanded key in accordion mode */
  accordionExpandedKey?: string;
}>();

const emit = defineEmits<{
  /** Bubble up the clicked item for selection */
  select: [item: SidebarItem];
  /** Bubble up the clicked item for expand toggle */
  expand: [item: SidebarItem];
}>();

/* ============================================================ */
/* Computed                                                       */
/* ============================================================ */

const isActive = computed(() => props.activeKey === props.item.key);

const hasChildren = computed(() =>
  Array.isArray(props.item.children) && props.item.children.length > 0,
);

const isExpanded = computed(() => {
  if (!hasChildren.value) return false;
  if (props.accordion) {
    return props.accordionExpandedKey === props.item.key;
  }
  return props.expandedKeys.includes(props.item.key);
});

const indentStyle = computed(() => {
  if (props.collapsed) return { paddingLeft: '0.75rem', paddingRight: '0.75rem' };
  const indentPx = props.level * 16;
  return { paddingLeft: `${12 + indentPx}px` };
});

/* ============================================================ */
/* Event handlers                                                 */
/* ============================================================ */

function handleClick(): void {
  if (props.item.disabled) return;
  // If has children, also toggle expand
  if (hasChildren.value) {
    emit('expand', props.item);
  }
  // Always select
  emit('select', props.item);
}

function handleKeydown(event: KeyboardEvent): void {
  if (props.item.disabled) return;
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    handleClick();
  }
}
</script>

<template>
  <div
    :data-sidebar-item="props.item.key"
    :class="
      cn(
        'group relative flex cursor-pointer items-center gap-2 py-2 text-sm',
        'transition-colors duration-150 select-none',
        'hover:bg-[hsl(var(--ydsz-comp-surface-hover))]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[hsl(var(--ydsz-comp-focus-ring-color))]',
        isActive && 'bg-[hsl(var(--ydsz-comp-surface-selected))] font-medium text-[hsl(var(--ydsz-color-brand-500))]',
        props.item.disabled && 'pointer-events-none cursor-not-allowed opacity-50',
        props.collapsed && 'justify-center px-3',
      )
    "
    :style="indentStyle"
    role="treeitem"
    :aria-level="props.level + 1"
    :aria-selected="isActive"
    :aria-expanded="hasChildren ? isExpanded : undefined"
    :aria-disabled="props.item.disabled || undefined"
    :tabindex="props.item.disabled ? -1 : 0"
    :title="props.collapsed ? props.item.label : undefined"
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <!-- Icon -->
    <YdIcon
      v-if="props.item.icon"
      :icon="props.item.icon"
      class="size-4 shrink-0"
      aria-hidden="true"
    />

    <!-- Label -->
    <span
      v-if="!props.collapsed"
      class="flex-1 truncate"
    >
      {{ props.item.label }}
    </span>

    <!-- Badge -->
    <span
      v-if="!props.collapsed && props.item.badge !== undefined"
      class="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[hsl(var(--ydsz-color-destructive-500))] px-1.5 text-[10px] font-medium leading-none text-white"
      :aria-label="`Badge ${props.item.badge}`"
    >
      {{ props.item.badge }}
    </span>

    <!-- Expand arrow -->
    <ChevronDown
      v-if="hasChildren && !props.collapsed"
      :class="
        cn(
          'size-3 shrink-0 transition-transform duration-200',
          isExpanded && 'rotate-180',
        )
      "
      aria-hidden="true"
    />

    <!-- Collapsed indicator for children -->
    <span
      v-if="hasChildren && props.collapsed"
      class="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-[hsl(var(--ydsz-color-brand-500))]"
      aria-hidden="true"
    />
  </div>

  <!-- Children (recursive render) -->
  <ul
    v-if="hasChildren && isExpanded && !props.collapsed"
    role="group"
    class="mt-0.5 flex flex-col gap-0.5"
  >
    <li
      v-for="child in (props.item.children as SidebarItem[])"
      :key="child.key"
      role="none"
    >
      <SidebarMenuItem
        :item="child"
        :level="props.level + 1"
        :collapsed="false"
        :active-key="props.activeKey"
        :expanded-keys="props.expandedKeys"
        :accordion="props.accordion"
        :accordion-expanded-key="props.accordionExpandedKey"
        @select="(item) => emit('select', item)"
        @expand="(item) => emit('expand', item)"
      />
    </li>
  </ul>
</template>
