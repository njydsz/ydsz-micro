<!--
 * ContextMenu（context-menu）组件：右键菜单容器，支持 ARIA menu 角色和键盘导航。
 *
 * WAI-ARIA 无障碍改进（云顶 §11 可访问性）:
 * - 容器 role="menu"；子项 role="menuitem"
 * - 键盘：↑↓/Home-End/Esc 导航与焦点循环
 * - aria-label / aria-labelledby 标签关联
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import { computed, ref } from 'vue';

import type { ContextMenuEmits, ContextMenuProps } from './context-menu-types';

defineOptions({ name: 'YdContextMenu' });

const props = withDefaults(defineProps<ContextMenuProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<ContextMenuEmits>();

let menuRef: HTMLElement | null = null;
const setMenuRef = (el: any) => {
  menuRef = el as HTMLElement | null;
};

/** 收集所有可用的 menuitem */
function getMenuItems(): HTMLElement[] {
  if (!menuRef) return [];
  return Array.from(
    menuRef.querySelectorAll<HTMLElement>(
      '[role="menuitem"]:not([disabled]):not([aria-disabled="true"])',
    ),
  );
}

function focusNext(current: HTMLElement) {
  const items = getMenuItems();
  if (items.length === 0) return;
  const idx = items.indexOf(current);
  items[(idx + 1) % items.length]?.focus();
}

function focusPrev(current: HTMLElement) {
  const items = getMenuItems();
  if (items.length === 0) return;
  const idx = items.indexOf(current);
  items[(idx - 1 + items.length) % items.length]?.focus();
}

function focusFirst() {
  getMenuItems()[0]?.focus();
}

function focusLast() {
  const items = getMenuItems();
  items[items.length - 1]?.focus();
}

function handleMenuKeydown(event: KeyboardEvent) {
  if (props.disabled) return;
  const target = event.target as HTMLElement;
  const isMenuItem = target.getAttribute('role') === 'menuitem';

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      isMenuItem ? focusNext(target) : focusFirst();
      break;
    case 'ArrowUp':
      event.preventDefault();
      isMenuItem ? focusPrev(target) : focusLast();
      break;
    case 'Home':
      event.preventDefault();
      focusFirst();
      break;
    case 'End':
      event.preventDefault();
      focusLast();
      break;
    case 'Escape':
      event.preventDefault();
      emit('update:open', false);
      emit('cancel');
      break;
    default:
      break;
  }
}

function handleConfirm() {
  emit('confirm');
  emit('update:open', false);
}

function handleCancel() {
  emit('cancel');
  emit('update:open', false);
}

const menuAriaAttrs = computed(() => ({
  role: 'menu' as const,
  'aria-disabled': props.disabled ? ('true' as const) : undefined,
}));

defineExpose({ focusFirst, focusLast });
</script>

<template>
  <div
    :ref="setMenuRef"
    :class="['yd-context-menu', { 'yd-context-menu--disabled': disabled }]"
    v-bind="menuAriaAttrs"
    @keydown="handleMenuKeydown"
  >
    <slot />
  </div>
</template>

<style scoped>
.yd-context-menu {
  display: inline-flex;
  flex-direction: column;
  align-items: stretch;
  gap: 2px;
  min-width: 8rem;
  padding: var(--ydsz-spacing-xs, 0.25rem);
  border-radius: var(--ydsz-radius-md, 0.5rem);
  background-color: hsl(var(--ydsz-surface-1));
  outline: none;
  box-shadow: 0 10px 15px -3px hsl(0 0% 0% / 0.1), 0 4px 6px -4px hsl(0 0% 0% / 0.1);
}

.yd-context-menu--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
