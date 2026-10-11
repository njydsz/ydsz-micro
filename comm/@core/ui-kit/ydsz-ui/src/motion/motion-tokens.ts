/**
 * 动效 tokens —— 定义全局动画时长与缓动曲线常量，
 * 供 prefers-reduced-motion 与组件内 transition 引用。
 *
 * @path comm/@core/ui-kit/ydsz-ui/src/motion/motion-tokens.ts
 * @since 26.10.10
 */

export const MotionDurations = {
  instant: '0ms',
  fast: '150ms',
  normal: '250ms',
  emphasis: '400ms',
} as const

export const MotionEasings = {
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
  accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
} as const

/** 当用户开启 prefers-reduced-motion: reduce 时返回 true */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
