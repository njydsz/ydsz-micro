/**
 * Transition 工具函数 — 为组件提供统一的动效引用入口。
 *
 * <p>使用方法：
 * <pre>{@code
 * import { injectTransition } from '@ydsz-core/design-tokens/transition-utils';
 * const transition = injectTransition();
 * // transition.fade() 返回 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)'
 * }</pre>
 *
 * <p>组件不再硬编码 `transition: all .3s`，而是引用 design token，确保全局动效一致。
 *
 * @path comm\@core\ui-kit\design-tokens\src\tokens\transition-utils.ts
 * @author ydsz-ai
 * @since 26.09.19
 */

import {
  DURATION_TOKENS,
  EASING_TOKENS,
  TRANSITION_PRESETS,
  durationVar,
  easingVar,
  type DurationToken,
  type EasingToken,
  type TransitionPresetName,
} from './motion';

export type { DurationToken, EasingToken, TransitionPresetName };

/**
 * 预置 transition 映射。
 *
 * 封装为函数：每次调用返回最新值，避免模块级缓存。
 */
export function injectTransition() {
  return {
    /** 使用预置 transition */
    preset: (name: TransitionPresetName): string => TRANSITION_PRESETS[name].css,
    /** 颜色过渡 */
    color: (): string => TRANSITION_PRESETS.color.css,
    /** 淡入+上移 */
    fadeUp: (): string => TRANSITION_PRESETS.fadeUp.css,
    /** 快速淡入 */
    fadeIn: (): string => TRANSITION_PRESETS.fadeIn.css,
    /** 缩放弹出 */
    scaleIn: (): string => TRANSITION_PRESETS.scaleIn.css,
    /** 抽屉滑入 */
    slideRight: (): string => TRANSITION_PRESETS.slideRight.css,
    /** 组合自定义 transition */
    compose: (props: string[], duration: DurationToken = 'normal', easing: EasingToken = 'standard'): string =>
      props.map((p) => `${p} ${durationVar(duration)} ${easingVar(easing)}`).join(', '),
    /** 引用原始 duration token */
    duration: (token: DurationToken): string => `var(--ydsz-motion-duration-${token})`,
    /** 引用原始 easing token */
    easing: (token: EasingToken): string => `var(--ydsz-motion-easing-${token})`,
    /** 原始 token 值（用于 duration 数值提取） */
    raw: {
      duration: DURATION_TOKENS,
      easing: EASING_TOKENS,
    },
  };
}

export type TransitionUtil = ReturnType<typeof injectTransition>;
