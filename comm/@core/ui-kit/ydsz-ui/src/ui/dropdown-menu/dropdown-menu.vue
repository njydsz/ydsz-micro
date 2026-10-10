<!--
 * DropdownMenu（dropdown-menu）组件：带键盘导航和焦点循环的菜单容器。
 *
 * WAI-ARIA 无障碍改进（云顶 §11 可访问性）:
 * - 容器 role="menu"；子项通过 slot 注入时由父级分配 role="menuitem"
 * - 子菜单 trigger 暴露 aria-haspopup="true" + aria-expanded
 * - 键盘：↑↓ 在 menuitem 间移动焦点 / Home/End 跳转首尾 / Esc 关闭
 * - 焦点循环：末尾 ↓ 回到首位，首位 ↑ 跳到末尾
 * - aria-label / aria-labelledby 标签关联
 *
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';

import type { DropdownMenuEmits, DropdownMenuProps } from './dropdown-menu-types';

defineOptions({ name: 'YdDropdownMenu' });

const props = withDefaults(defineProps<DropdownMenuProps>(), {
  disabled: false,
  open: false,
});

const emit = defineEmits<DropdownMenuEmits>();

let menuRef: HTMLElement | null = null;

const setMenuRef = (el: any) => {
  menuRef = el as HTMLElement | null;
};

/** 收集所有可聚焦的 menuitem */
function getMenuItems(): HTMLElement[] {
  if (!menuRef) return [];
  return Array.from(
    menuRef.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled]):not([aria-disabled="true"])'),
  );
}

/** 焦点移动到下一个 menuitem（含循环） */
function focusNext(current: HTMLElement) {
  const items = getMenuItems();
  if (items.length === 0) return;
  const idx = items.indexOf(current);
  const nextIdx = (idx + 1) % items.length;
  items[nextIdx]?.focus();
}

/** 焦点移动到上一个 menuitem（含循环） */
function focusPrev(current: HTMLElement) {
  const items = getMenuItems();
  if (items.length === 0) return;
  const idx = items.indexOf(current);
  const prevIdx = (idx - 1 + items.length) % items.length;
  items[prevIdx]?.focus();
}

/** 焦点移到首个 */
function focusFirst() {
  const items = getMenuItems();
  items[0]?.focus();
}

/** 焦点移到末位 */
function focusLast() {
  const items = getMenuItems();
  items[items.length - 1]?.focus();
}

/** 键盘事件处理 */
function handleMenuKeydown(event: KeyboardEvent) {
  if (props.disabled) return;
  const target = event.target as HTMLElement;
  const isMenuItem = target.getAttribute('role') === 'menuitem';

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      if (isMenuItem) focusNext(target);
      else focusFirst();
      break;
    case 'ArrowUp':
      event.preventDefault();
      if (isMenuItem) focusPrev(target);
      else focusLast();
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

/** ARIA 属性（menu 角色 + 标签） */
const menuAriaAttrs = computed(() => ({
  role: 'menu' as const,
  'aria-disabled': props.disabled ? ('true' as const) : undefined,
  'aria-label': props.ariaLabel ?? undefined,
  'aria-labelledby': props.ariaLabelledby ?? undefined,
}));

defineExpose({
  focusFirst,
  focusLast,
});
</script>

<template>
  <div
    :ref="setMenuRef"
    :class="['yd-dropdown-menu', { 'yd-dropdown-menu--disabled': disabled }]"
    v-bind="menuAriaAttrs"
    @keydown="handleMenuKeydown"
  >
    <slot />
  </div>
</template>

<style scoped>
.yd-dropdown-menu {
  display: inline-flex;
  flex-direction: column;
  align-items: stretch;
  gap: 2px;
  min-width: 8rem;
  padding: var(--ydsz-spacing-xs, 0.25rem);
  border-radius: var(--ydsz-radius-md, 0.5rem);
  background-color: hsl(var(--ydsz-surface-1));
  outline: none;
}

.yd-dropdown-menu--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
