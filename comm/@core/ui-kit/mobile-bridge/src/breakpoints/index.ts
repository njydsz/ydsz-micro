/**
 * 响应式断点定义。
 *
 * <p>对齐 Tailwind CSS 断点体系，为 JS 逻辑层提供统一的断点阈值。
 *
 * <p>断点用途分类：
 * <ul>
 *   <li><b>mobile</b> — 手机竖屏 (&lt; 640px)</li>
 *   <li><b>tablet</b> — 平板/手机横屏 (640px - 1023px)</li>
 *   <li><b>desktop</b> — 桌面 (1024px - 1279px)</li>
 *   <li><b>wide</b> — 大屏 (1280px - 1535px)</li>
 *   <li><b>ultrawide</b> — 超宽屏 (1536px+)</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\mobile-bridge\src\breakpoints\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** 断点枚举 */
export enum Breakpoint {
  MOBILE_MAX = 639,
  TABLET_MIN = 640,
  TABLET_MAX = 1023,
  DESKTOP_MIN = 1024,
  DESKTOP_MAX = 1279,
  WIDE_MIN = 1280,
  WIDE_MAX = 1535,
  ULTRAWIDE_MIN = 1536,
}

/** 断点名称 */
export type BreakpointName = 'mobile' | 'tablet' | 'desktop' | 'wide' | 'ultrawide';

/** 各断点名称对应的 CSS 变量 */
export const BREAKPOINT_CSS_VARS = {
  mobile: 'var(--ydsz-bp-mobile)',
  tablet: 'var(--ydsz-bp-tablet)',
  desktop: 'var(--ydsz-bp-desktop)',
  wide: 'var(--ydsz-bp-wide)',
  ultrawide: 'var(--ydsz-bp-ultrawide)',
} as const;

/**
 * 根据当前视口宽度获取断点名称。
 *
 * @param width 视口宽度
 * @return 断点名称
 */
export function getBreakpointName(width: number): BreakpointName {
  if (width < Breakpoint.TABLET_MIN) {
    return 'mobile';
  }
  if (width < Breakpoint.DESKTOP_MIN) {
    return 'tablet';
  }
  if (width < Breakpoint.WIDE_MIN) {
    return 'desktop';
  }
  if (width < Breakpoint.ULTRAWIDE_MIN) {
    return 'wide';
  }
  return 'ultrawide';
}

/**
 * 触摸友好尺寸规范（参考 Android HIG / iOS HIG 的最小触摸目标 44px）。
 */
export const TOUCH_TARGET = {
  /** 最小推荐触摸区域 */
  MIN_SIZE: 44,
  /** 紧凑场景最小尺寸 */
  COMPACT_SIZE: 36,
  /** 元素间距 */
  SPACING: 8,
};
