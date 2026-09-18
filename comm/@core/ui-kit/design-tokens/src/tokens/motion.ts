/**
 * 动效 Design Token。
 *
 * <p>定义全局动画曲线、时长和缓动函数，确保产品动效一致。
 * 分类：
 * <ul>
 *   <li><b>duration</b> — 动画时长（ms）</li>
 *   <li><b>easing</b> — 贝塞尔缓动函数</li>
 *   <li><b>transition</b> — transition 快捷组合</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\design-tokens\src\tokens\motion.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** 时长阶梯（毫秒） */
export const DURATION_TOKENS = {
  /** 瞬时反馈（hover / focus ring 等） */
  instant: 100,
  /** 快速过渡（switch / toggle / tab 切换） */
  fast: 150,
  /** 标准过渡（dropdown / modal enter） */
  normal: 200,
  /** 慢速过渡（drawer / 大型面板 expand） */
  slow: 300,
  /** 强调动画（route transition） */
  emphasis: 500,
} as const;

export type DurationToken = keyof typeof DURATION_TOKENS;

/** 缓动曲线 */
export const EASING_TOKENS = {
  /** 线性 */
  linear: 'linear',
  /** 标准缓入缓出（最常用） */
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  /** 缓入（enter 动画） */
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  /** 缓出（exit 动画） */
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  /** 弹性（attention 动画） */
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

export type EasingToken = keyof typeof EASING_TOKENS;

/** CSS 变量前缀 */
const VAR_PREFIX = '--ydsz-motion';

/**
 * 时长变量引用。
 *
 * @param token 时长 key
 * @return CSS 变量引用表达式
 */
export function durationVar(token: DurationToken): string {
  return `var(${VAR_PREFIX}-duration-${token})`;
}

/**
 * 缓动变量引用。
 *
 * @param token 缓动 key
 * @return CSS 变量引用表达式
 */
export function easingVar(token: EasingToken): string {
  return `var(${VAR_PREFIX}-easing-${token})`;
}

/** Transition 快捷组合 */
export interface TransitionPreset {
  /** CSS transition 属性值 */
  css: string;
}

/** 预置 transition 组合 */
export const TRANSITION_PRESETS = {
  /** 标准淡入+位移 */
  fadeUp: {
    css: `opacity ${DURATION_TOKENS.normal}ms ${EASING_TOKENS.standard}, transform ${DURATION_TOKENS.normal}ms ${EASING_TOKENS.standard}`,
  },
  /** 快速淡入 */
  fadeIn: {
    css: `opacity ${DURATION_TOKENS.fast}ms ${EASING_TOKENS.standard}`,
  },
  /** 缩放弹出 */
  scaleIn: {
    css: `transform ${DURATION_TOKENS.fast}ms ${EASING_TOKENS.spring}, opacity ${DURATION_TOKENS.fast}ms ${EASING_TOKENS.standard}`,
  },
  /** 抽屉滑入 */
  slideRight: {
    css: `transform ${DURATION_TOKENS.slow}ms ${EASING_TOKENS.standard}`,
  },
  /** 颜色过渡 */
  color: {
    css: `color ${DURATION_TOKENS.fast}ms ${EASING_TOKENS.standard}, background-color ${DURATION_TOKENS.fast}ms ${EASING_TOKENS.standard}, border-color ${DURATION_TOKENS.fast}ms ${EASING_TOKENS.standard}`,
  },
} as const;

export type TransitionPresetName = keyof typeof TRANSITION_PRESETS;
