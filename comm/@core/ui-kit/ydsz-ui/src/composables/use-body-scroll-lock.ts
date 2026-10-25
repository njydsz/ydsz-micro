/**
 * useBodyScrollLock —— 浮层打开时锁定 body 滚动（引用计数版）。
 *
 * <p>为什么不用 `@vueuse/core` 的 useScrollLock：它按调用实例各自记录状态，
 * 两个抽屉叠加时先关的那个会把 overflow 直接清空，导致后一个还在展示却已能滚动。
 * 这里用模块级引用计数，只有最后一个浮层释放时才恢复原始样式。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-body-scroll-lock.ts
 * @author ydsz-team
 * @since 5.7.0
 */

import { onBeforeUnmount, watch } from 'vue';

import type { Ref } from 'vue';

/** 当前持有滚动锁的浮层数量 */
let lockCount = 0;

/** 锁定前的 body 内联样式快照 */
let savedStyle: { overflow: string; paddingRight: string } | null = null;

/**
 * 计算滚动条占位宽度，用于锁定后补回 padding 避免内容横向跳动。
 *
 * @returns 滚动条宽度像素
 */
function scrollbarWidth(): number {
  return Math.max(0, window.innerWidth - document.documentElement.clientWidth);
}

/**
 * 锁定或释放 body 滚动。
 *
 * @param active - 浮层是否打开
 * @returns 无
 */
export function useBodyScrollLock(active: Ref<boolean>): void {
  function applyLock(): void {
    if (lockCount === 0) {
      savedStyle = {
        overflow: document.body.style.overflow,
        paddingRight: document.body.style.paddingRight,
      };
      document.body.style.overflow = 'hidden';
      const gap = scrollbarWidth();
      if (gap > 0) {
        const current = Number.parseFloat(document.body.style.paddingRight || '0') || 0;
        document.body.style.paddingRight = `${current + gap}px`;
      }
    }
    lockCount += 1;
  }

  function releaseLock(): void {
    if (lockCount === 0) return;
    lockCount -= 1;
    if (lockCount === 0 && savedStyle) {
      document.body.style.overflow = savedStyle.overflow;
      document.body.style.paddingRight = savedStyle.paddingRight;
      savedStyle = null;
    }
  }

  watch(
    active,
    (visible) => {
      if (typeof document === 'undefined' || typeof window === 'undefined') return;
      if (visible) applyLock();
      else releaseLock();
    },
    { immediate: true },
  );

  /** 组件被直接销毁（未经关闭流程）时也要释放计数 */
  onBeforeUnmount(() => {
    if (active.value) releaseLock();
  });
}
