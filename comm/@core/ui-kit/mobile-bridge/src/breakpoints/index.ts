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

/*
 * 曾有 `BREAKPOINT_CSS_VARS = { desktop: 'var(--ydsz-bp-desktop)', ... }`，已删除。
 * 它是不可用的 API：CSS 自定义属性不能出现在 @media 特征里
 * （`@media (min-width: var(--x))` 整条查询会被浏览器判为 invalid 而丢弃，
 * matchMedia 同样返回 matches:false），且 `--ydsz-bp-*` 从未被任何令牌文件定义。
 * 零消费方，留着只会诱导下一个调用者写出永不生效的响应式逻辑。
 * JS 侧请用本文件的数值枚举拼查询：
 *   matchMedia(`(min-width: ${Breakpoint.DESKTOP_MIN}px)`)
 * CSS 侧请用 default.css 的 --bp-sm/md/lg/xl/2xl 字面值（媒体查询里同样不能套 var）。
 */

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
