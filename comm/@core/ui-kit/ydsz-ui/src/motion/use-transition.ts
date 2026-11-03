/**
 * useTransition composable —— 统一的过渡动画控制。
 *
 * <p>提供：
 * <ul>
 *   <li>进入/离开动画状态管理</li>
 *   <li>基于 CSS transition 的声明式动画</li>
 *   <li>支持 duration / easing / delay 配置</li>
 *   <li>自动清理（onScopeDispose）</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\motion\use-transition.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { onScopeDispose, ref, type Ref } from 'vue';

/** 过渡方向 */
export type TransitionDirection = 'enter' | 'leave';

/** 过渡状态 */
export type TransitionPhase = 'idle' | 'entering' | 'entered' | 'leaving' | 'left';

/** useTransition 配置 */
export interface UseTransitionOptions {
  /** 进入动画时长（ms），默认 200 */
  enterDuration?: number;
  /** 离开动画时长（ms），默认 150 */
  leaveDuration?: number;
  /** 缓动函数，默认 ease-in-out */
  easing?: string;
  /** 延迟（ms），默认 0 */
  delay?: number;
}

/** useTransition 返回结果 */
export interface TransitionResult {
  /** 当前是否可见 */
  visible: Ref<boolean>;
  /** 当前动画阶段 */
  phase: Ref<TransitionPhase>;
  /** 进入动画样式 */
  enterStyle: Ref<Record<string, string>>;
  /** 离开动画样式 */
  leaveStyle: Ref<Record<string, string>>;
  /** 显示 */
  show: () => void;
  /** 隐藏 */
  hide: () => void;
  /** 切换 */
  toggle: () => void;
  /** 重置状态 */
  reset: () => void;
}

/**
 * 统一的过渡动画控制 composable。
 *
 * @param options - 动画配置
 * @returns 过渡动画控制器
 *
 * @example
 * ```ts
 * const { visible, phase, show, hide, toggle } = useTransition();
 * ```
 */
export function useTransition(options: UseTransitionOptions = {}): TransitionResult {
  const {
    delay = 0,
    easing = 'ease-in-out',
    enterDuration = 200,
    leaveDuration = 150,
  } = options;

  const visible = ref(false);
  const phase = ref<TransitionPhase>('idle');

  const enterStyle = ref<Record<string, string>>({
    opacity: '0',
    transform: 'translateY(8px)',
    transition: `all ${enterDuration}ms ${easing} ${delay}ms`,
  });

  const leaveStyle = ref<Record<string, string>>({
    opacity: '0',
    transform: 'translateY(-4px)',
    transition: `all ${leaveDuration}ms ${easing} ${delay}ms`,
  });

  function show(): void {
    if (visible.value) return;
    visible.value = true;
    phase.value = 'entering';
    requestAnimationFrame(() => {
      enterStyle.value = {
        ...enterStyle.value,
        opacity: '1',
        transform: 'translateY(0)',
      };
      setTimeout(() => {
        phase.value = 'entered';
      }, enterDuration + delay);
    });
  }

  function hide(): void {
    if (!visible.value) return;
    phase.value = 'leaving';
    leaveStyle.value = {
      ...leaveStyle.value,
      opacity: '0',
      transform: 'translateY(-4px)',
    };
    setTimeout(() => {
      visible.value = false;
      phase.value = 'left';
    }, leaveDuration + delay);
  }

  function toggle(): void {
    if (visible.value) {
      hide();
    } else {
      show();
    }
  }

  function reset(): void {
    visible.value = false;
    phase.value = 'idle';
    enterStyle.value = {
      opacity: '0',
      transform: 'translateY(8px)',
      transition: `all ${enterDuration}ms ${easing} ${delay}ms`,
    };
    leaveStyle.value = {
      opacity: '0',
      transform: 'translateY(-4px)',
      transition: `all ${leaveDuration}ms ${easing} ${delay}ms`,
    };
  }

  // 自动清理
  onScopeDispose(() => {
    reset();
  });

  return {
    enterStyle,
    hide,
    leaveStyle,
    phase,
    reset,
    show,
    toggle,
    visible,
  };
}
