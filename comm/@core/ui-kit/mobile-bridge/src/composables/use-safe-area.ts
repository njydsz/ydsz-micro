/**
 * useSafeArea — 移动端安全区适配 composable。
 *
 * <p>处理 iOS 刘海屏、Android 导航栏等「非矩形屏幕」的底部安全区，
 * 通过 CSS env() 变量与 fallback 机制保证底部固定元素不被遮挡。
 *
 * @path comm\@core\ui-kit\mobile-bridge\src\composables\use-safe-area.ts
 * @author ydsz-ai
 * @since 26.09.19
 */

import { computed, onMounted, ref } from 'vue';

/** 安全区配置 */
export interface UseSafeAreaOptions {
  /** 底部额外偏移（px），在 env 值基础上叠加 */
  extraBottom?: number;
  /** 顶部额外偏移（px） */
  extraTop?: number;
}

/**
 * 安全区 composable。
 *
 * <p>读取 CSS safe-area-inset-* 环境变量，当浏览器不支持时回退到 0。
 *
 * @return 计算后的 padding 样式对象与原始偏移值
 */
export function useSafeArea(options: UseSafeAreaOptions = {}) {
  const { extraBottom = 0, extraTop = 0 } = options;

  /** 底栏是否处于移动端 */
  const isMobile = ref<boolean>(typeof window !== 'undefined' && window.innerWidth <= 768);

  /** 底部安全偏移 */
  const paddingBottom = computed<string>(() => {
    if (!isMobile.value) return `${extraBottom}px`;
    return `calc(env(safe-area-inset-bottom, 0px) + ${extraBottom}px)`;
  });

  /** 顶部安全偏移 */
  const paddingTop = computed<string>(() => {
    return `calc(env(safe-area-inset-top, 0px) + ${extraTop}px)`;
  });

  /** 底部裸偏移值 */
  const bottomOffset = ref<number>(extraBottom);

  /** 检测移动端 */
  function detectMobile(): void {
    if (typeof window === 'undefined') return;
    isMobile.value = window.innerWidth <= 768
      || 'ontouchstart' in window
      || navigator.maxTouchPoints > 0;
  }

  onMounted(() => {
    detectMobile();
    window.addEventListener('resize', detectMobile, { passive: true });
  });

  return {
    isMobile,
    paddingBottom,
    paddingTop,
    bottomOffset,
  };
}

export type SafeAreaReturn = ReturnType<typeof useSafeArea>;
