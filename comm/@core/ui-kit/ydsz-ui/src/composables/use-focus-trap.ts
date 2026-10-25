/**
 * useFocusTrap —— 浮层焦点约束 composable。
 *
 * <p>职责：
 * <ul>
 *   <li>激活时把焦点移入容器（优先第一个可聚焦元素，否则容器自身）</li>
 *   <li>Tab / Shift+Tab 在容器内循环，不会漏到背景页面</li>
 *   <li>关闭时把焦点交还给打开前的元素</li>
 * </ul>
 *
 * <p>与 ydsz-vue 的 `trapFocus` 区别：那个函数一次性绑定且不解绑，适合
 * radix 内部一次性使用；本 composable 面向可反复开关的浮层，监听器随
 * active 生命周期成对增删。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-focus-trap.ts
 * @author ydsz-team
 * @since 5.7.0
 */

import { onBeforeUnmount, nextTick, watch } from 'vue';

import type { Ref } from 'vue';

/** 容器内可聚焦元素选择器 */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(',');

/** useFocusTrap 配置 */
export interface UseFocusTrapOptions {
  /** 是否处于激活（打开）状态 */
  active: Ref<boolean>;
  /** 被约束的容器元素 */
  container: Ref<HTMLElement | undefined>;
  /** 是否恢复焦点，默认 true */
  restoreFocus?: boolean;
}

/**
 * 查询容器内当前可聚焦的元素。
 *
 * @param container - 容器元素
 * @returns 可聚焦元素列表
 */
function getFocusable(container: HTMLElement): HTMLElement[] {
  // 用 attribute 而非 el.tabIndex 判断：原生可聚焦元素不写 tabindex 时 IDL 默认值随实现而变，属性判断只排除显式 -1
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter((el) => el.getAttribute('tabindex') !== '-1' && !el.hasAttribute('aria-hidden'));
}

/**
 * 激活时约束焦点、关闭时复原。
 *
 * @param options - 配置项
 * @returns 无
 */
export function useFocusTrap(options: UseFocusTrapOptions): void {
  const { active, container, restoreFocus = true } = options;

  /** 打开前的焦点元素，关闭时回还 */
  let previouslyFocused: HTMLElement | null = null;

  function onKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const element = container.value;
    if (!element) return;
    const focusable = getFocusable(element);
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusable[0] as HTMLElement;
    const last = focusable[focusable.length - 1] as HTMLElement;
    const current = document.activeElement as HTMLElement | null;

    if (event.shiftKey && (current === first || current === element)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && current === last) {
      event.preventDefault();
      first.focus();
    }
  }

  async function activate(): Promise<void> {
    previouslyFocused = document.activeElement as HTMLElement | null;
    await nextTick();
    const element = container.value;
    if (!element) return;
    // 已在容器内（例如由触发按钮进入）时不抢占焦点
    if (element.contains(document.activeElement)) return;
    const first = getFocusable(element)[0];
    (first ?? element).focus();
  }

  function deactivate(): void {
    document.removeEventListener('keydown', onKeyDown);
    if (restoreFocus) previouslyFocused?.focus?.();
    previouslyFocused = null;
  }

  watch(
    active,
    (visible) => {
      if (visible) {
        document.addEventListener('keydown', onKeyDown);
        void activate();
      } else {
        deactivate();
      }
    },
    { immediate: true },
  );

  onBeforeUnmount(() => {
    document.removeEventListener('keydown', onKeyDown);
  });
}
