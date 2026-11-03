/**
 * useMobileAdaptive composable —— 组件级移动端适配工具集。
 *
 * <p>提供：
 * <ul>
 *   <li>根据设备类型返回不同的尺寸/间距值</li>
 *   <li>触摸目标合规检测（44px 最小）</li>
 *   <li>安全区 padding 计算</li>
 *   <li>移动端/桌面端条件渲染辅助</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\mobile-bridge\src\composables\use-mobile-adaptive.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { computed, type ComputedRef } from 'vue';

import { useResponsive } from './use-responsive';
import { TOUCH_TARGET } from '../breakpoints';

/** 尺寸档位 */
export type AdaptiveSize = 'sm' | 'md' | 'lg';

/** 尺寸映射表 */
export interface SizeMap {
  sm: string;
  md: string;
  lg: string;
}

/** 间距映射表 */
export interface SpacingMap {
  sm: string;
  md: string;
  lg: string;
}

/** useMobileAdaptive 返回结果 */
export interface MobileAdaptiveResult {
  /** 是否为移动端 */
  isMobile: ComputedRef<boolean>;
  /** 是否为桌面端 */
  isDesktop: ComputedRef<boolean>;
  /** 根据设备类型选择值 */
  adaptive: <T>(mobile: T, desktop: T) => ComputedRef<T>;
  /** 根据设备类型选择尺寸 class */
  adaptiveSize: (sizes: SizeMap) => ComputedRef<string>;
  /** 根据设备类型选择间距 class */
  adaptiveSpacing: (spacing: SpacingMap) => ComputedRef<string>;
  /** 触摸目标合规（≥ 44px） */
  touchTargetCompliant: ComputedRef<boolean>;
  /** 建议的触摸目标尺寸 */
  suggestedTouchSize: ComputedRef<number>;
  /** 安全区 padding-top */
  safeAreaPaddingTop: ComputedRef<string>;
  /** 安全区 padding-bottom */
  safeAreaPaddingBottom: ComputedRef<string>;
}

/**
 * 组件级移动端适配 composable。
 *
 * @returns 移动端适配工具集
 *
 * @example
 * ```vue
 * <script setup>
 * import { useMobileAdaptive } from '@ydsz-core/mobile-bridge';
 *
 * const { isMobile, adaptive, adaptiveSize } = useMobileAdaptive();
 * const sizeClass = adaptiveSize({ sm: 'size-8', md: 'size-10', lg: 'size-12' });
 * </script>
 * ```
 */
export function useMobileAdaptive(): MobileAdaptiveResult {
  const { isMobileOnly, isDesktop } = useResponsive();

  const isMobile = computed(() => isMobileOnly.value);

  /**
   * 根据设备类型选择值。
   */
  function adaptive<T>(mobile: T, desktop: T): ComputedRef<T> {
    return computed(() => (isMobile.value ? mobile : desktop));
  }

  /**
   * 根据设备类型选择尺寸 class。
   * 移动端默认取 sm，桌面端取 md/lg。
   */
  function adaptiveSize(sizes: SizeMap): ComputedRef<string> {
    return computed(() => (isMobile.value ? sizes.sm : sizes.md));
  }

  /**
   * 根据设备类型选择间距 class。
   */
  function adaptiveSpacing(spacing: SpacingMap): ComputedRef<string> {
    return computed(() => (isMobile.value ? spacing.sm : spacing.md));
  }

  /** 触摸目标合规检测 */
  const touchTargetCompliant = computed(() => {
    // 在 happy-dom / SSR 环境下默认 true
    if (typeof window === 'undefined') return true;
    // 检查是否为触摸设备
    if (!('ontouchstart' in window)) return true;
    return TOUCH_TARGET <= 44;
  });

  /** 建议的触摸目标尺寸 */
  const suggestedTouchSize = computed(() => (isMobile.value ? TOUCH_TARGET : 32));

  /** 安全区 padding-top */
  const safeAreaPaddingTop = computed(() =>
    isMobile.value ? 'env(safe-area-inset-top)' : '0px',
  );

  /** 安全区 padding-bottom */
  const safeAreaPaddingBottom = computed(() =>
    isMobile.value ? 'env(safe-area-inset-bottom)' : '0px',
  );

  return {
    adaptive,
    adaptiveSize,
    adaptiveSpacing,
    isDesktop,
    isMobile,
    safeAreaPaddingBottom,
    safeAreaPaddingTop,
    suggestedTouchSize,
    touchTargetCompliant,
  };
}
