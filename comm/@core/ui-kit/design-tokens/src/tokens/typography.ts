/**
 * 排版 Design Token。
 *
 * <p>定义字号、行高和字重的层级体系。
 *
 * @path comm\@core\ui-kit\design-tokens\src\tokens\typography.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** 字号 Token（对应 Tailwind font-size） */
export const FONT_SIZE_TOKENS = {
  /** 10px — 极小标签 */
  '2xs': '0.625rem',
  /** 12px — 小标签/辅助文字 */
  xs: '0.75rem',
  /** 14px — 正文默认 */
  sm: '0.875rem',
  /** 16px — 大正文 */
  base: '1rem',
  /** 20px — 小标题 */
  lg: '1.25rem',
  /** 24px — 卡片标题 */
  xl: '1.5rem',
  /** 30px — 区块标题 */
  '2xl': '1.875rem',
  /** 36px — 页面标题 */
  '3xl': '2.25rem',
} as const;

export type FontSizeToken = keyof typeof FONT_SIZE_TOKENS;

/** 行高 Token */
export const LINE_HEIGHT_TOKENS = {
  /** 1 — 紧凑标题 */
  tight: '1.25',
  /** 1.375 — 标题 */
  snug: '1.375',
  /** 1.5 — 正文 */
  normal: '1.5',
  /** 1.625 — 大正文 */
  relaxed: '1.625',
  /** 2 — 大标题 */
  loose: '2',
} as const;

export type LineHeightToken = keyof typeof LINE_HEIGHT_TOKENS;

/** 字重 Token */
export const FONT_WEIGHT_TOKENS = {
  /** 400 — 常规 */
  normal: '400',
  /** 500 — 中等 */
  medium: '500',
  /** 600 — 半粗 */
  semibold: '600',
  /** 700 — 加粗 */
  bold: '700',
} as const;

export type FontWeightToken = keyof typeof FONT_WEIGHT_TOKENS;

/**
 * 字号变量引用。
 *
 * @param token 字号 key
 * @return CSS 变量引用表达式
 */
export function fontSizeVar(token: FontSizeToken): string {
  return `var(--ydsz-font-size-${token})`;
}

/**
 * 行高变量引用。
 *
 * @param token 行高 key
 * @return CSS 变量引用表达式
 */
export function lineHeightVar(token: LineHeightToken): string {
  return `var(--ydsz-line-height-${token})`;
}

/**
 * 字重变量引用。
 *
 * @param token 字重 key
 * @return CSS 变量引用表达式
 */
export function fontWeightVar(token: FontWeightToken): string {
  return `var(--ydsz-font-weight-${token})`;
}
