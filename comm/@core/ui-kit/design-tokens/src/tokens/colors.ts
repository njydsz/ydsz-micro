/**
 * 颜色 Design Token。
 *
 * <p>分层体系：
 * <ul>
 *   <li><b>raw</b> — 原始 HSL 组件 (h, s, l)</li>
 *   <li><b>primitive</b> — 基于 raw 计算出的 50~700 色阶</li>
 *   <li><b>semantic</b> — 业务语义色（surface / text / border / brand / status）</li>
 * </ul>
 *
 * <p>命名约定：语义名 → CSS 变量名 --ydsz-{category}-{role}，
 * 业务侧统一通过 CSS 变量引用，禁止 hardcode 颜色值。
 *
 * @path comm\@core\ui-kit\design-tokens\src\tokens\colors.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** 原始 HSL 组件（用于构建色阶） */
export interface RawColorComponents {
  /** 色相 (0-360) */
  h: number;
  /** 饱和度 (0-100) */
  s: number;
  /** 亮度 (0-100) */
  l: number;
}

/** 色阶梯级 */
export type ColorShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700;

/** 色阶梯级数值 */
export const COLOR_SHADES: readonly ColorShade[] = [50, 100, 200, 300, 400, 500, 600, 700];

/**
 * 品牌色原始 HSL。
 */
export const BRAND_RAW: RawColorComponents = {
  h: 222,
  s: 47,
  l: 31,
};

/**
 * 成功色原始 HSL。
 */
export const SUCCESS_RAW: RawColorComponents = {
  h: 142,
  s: 71,
  l: 45,
};

/**
 * 警告色原始 HSL。
 */
export const WARNING_RAW: RawColorComponents = {
  h: 38,
  s: 92,
  l: 50,
};

/**
 * 危险色原始 HSL。
 */
export const DESTRUCTIVE_RAW: RawColorComponents = {
  h: 0,
  s: 84,
  l: 60,
};

/**
 * 中性色原始 HSL。
 */
export const NEUTRAL_RAW: RawColorComponents = {
  h: 222,
  s: 13,
  l: 31,
};

/** 语义角色枚举 */
export type SemanticRole =
  | 'brand'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'neutral';

/** 语义色映射 */
export const SEMANTIC_RAW_MAP: Record<SemanticRole, RawColorComponents> = {
  brand: BRAND_RAW,
  success: SUCCESS_RAW,
  warning: WARNING_RAW,
  destructive: DESTRUCTIVE_RAW,
  neutral: NEUTRAL_RAW,
};

/**
 * 生成指定 HSL 的色阶（返回 CSS 变量引用）。
 *
 * @param name 语义角色名
 * @param shade 目标色阶
 * @return CSS 变量引用表达式
 */
export function colorTokenVar(name: SemanticRole, shade: ColorShade): string {
  return `var(--ydsz-color-${name}-${shade})`;
}

/**
 * 语义色 surface 变量名（用于背景层）。
 *
 * @param level 层级（1 = 最浅，3 = 最深）
 * @return CSS 变量引用表达式
 */
export function surfaceTokenVar(level: 1 | 2 | 3): string {
  return `var(--ydsz-surface-${level})`;
}

/**
 * 语义色 text 变量名（用于文本层）。
 *
 * @param level primary | secondary | tertiary | disabled | inverse
 * @return CSS 变量引用表达式
 */
export function textTokenVar(level: 'primary' | 'secondary' | 'tertiary' | 'disabled' | 'inverse'): string {
  return `var(--ydsz-text-${level})`;
}

/**
 * 语义色 border 变量名（用于边框层）。
 *
 * @param level DEFAULT | strong | subtle
 * @return CSS 变量引用表达式
 */
export function borderTokenVar(level: 'DEFAULT' | 'strong' | 'subtle'): string {
  return `var(--ydsz-border-${level.toLowerCase()})`;
}
