/**
 * 间距 Design Token。
 *
 * <p>8px 基准的 4 倍数网格系统，确保视觉节奏统一。
 *
 * @path comm\@core\ui-kit\design-tokens\src\tokens\spacing.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** 间距 Token（对应 Tailwind spacing scale） */
export const SPACING_TOKENS = {
  /** 4px — 极小间距 */
  xxs: '0.25rem',
  /** 8px — 小间距 */
  xs: '0.5rem',
  /** 12px — 标准紧凑间距 */
  sm: '0.75rem',
  /** 16px — 默认间距 */
  md: '1rem',
  /** 20px — 中等间距 */
  lg20: '1.25rem',
  /** 24px — 宽松间距 */
  lg: '1.5rem',
  /** 32px — 段落间距 */
  xl: '2rem',
  /** 40px — 区块间距 */
  '2xl': '2.5rem',
  /** 48px — 大区块间距 */
  '3xl': '3rem',
  /** 64px — 页面级间距 */
  '4xl': '4rem',
} as const;

export type SpacingToken = keyof typeof SPACING_TOKENS;

/**
 * CSS 变量引用。
 *
 * @param token 间距 key
 * @return CSS 变量引用表达式
 */
export function spacingVar(token: SpacingToken): string {
  return `var(--ydsz-spacing-${token})`;
}

/** 圆角 Token */
export const RADIUS_TOKENS = {
  /** 2px — 极小 */
  xs: '0.125rem',
  /** 4px — 小 */
  sm: '0.25rem',
  /** 6px — 默认输入框 */
  md: '0.375rem',
  /** 8px — 卡片 */
  lg: '0.5rem',
  /** 12px — 大卡片/浮层 */
  xl: '0.75rem',
  /** 16px — 模态框 */
  '2xl': '1rem',
  /** 9999px — 圆形/胶囊 */
  full: '9999px',
} as const;

export type RadiusToken = keyof typeof RADIUS_TOKENS;

/**
 * 圆角变量引用。
 *
 * @param token 圆角 key
 * @return CSS 变量引用表达式
 */
export function radiusVar(token: RadiusToken): string {
  return `var(--ydsz-radius-${token})`;
}
