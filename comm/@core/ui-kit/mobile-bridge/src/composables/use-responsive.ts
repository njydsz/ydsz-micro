/**
 * useResponsive — 高精度响应式断点组合式 API。
 *
 * <p>提供 viewport 宽度和当前断点名称的响应式状态。
 *
 * @path comm\@core\ui-kit\mobile-bridge\src\composables\use-responsive.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { computed, ref } from 'vue';

import { useWindowSize } from '@vueuse/core';

import { getBreakpointName } from '../breakpoints';

/**
 * 响应式断点组合式 API。
 *
 * @return viewport 和断点相关的响应式状态
 */
export function useResponsive() {
  const { width, height } = useWindowSize();

  /** 当前断点名称 */
  const breakpoint = computed<string>(() => getBreakpointName(width.value));

  /** 是否为移动端（含 tablet） */
  const isMobileOrTablet = computed<boolean>(
    () => width.value < 1024,
  );

  /** 是否为纯移动端 */
  const isMobileOnly = computed<boolean>(
    () => width.value < 640,
  );

  /** 是否为桌面端（含 wide/ultrawide） */
  const isDesktop = computed<boolean>(
    () => width.value >= 1024,
  );

  /** 是否为宽屏（≥ 1280） */
  const isWideScreen = computed<boolean>(
    () => width.value >= 1280,
  );

  /** 适合显示几列栅格（根据断点自动） */
  const gridColumns = computed<number>(() => {
    const w = width.value;
    if (w < 640) {
      return 1;
    }
    if (w < 1024) {
      return 2;
    }
    if (w < 1280) {
      return 3;
    }
    return 4;
  });

  return {
    width,
    height,
    breakpoint,
    isMobileOrTablet,
    isMobileOnly,
    isDesktop,
    isWideScreen,
    gridColumns,
  };
}
