/**
 * LoadingBar 组件的 props / emits 类型。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\loading-bar\types.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/**
 * LoadingBar 组件属性。
 */
export interface LoadingBarProps {
  /** 自定义 CSS class */
  class?: string;
  /** 进度条颜色（CSS 值），默认 'hsl(var(--primary))' */
  color?: string;
  /** 进度条高度（px），默认 3 */
  height?: number;
  /** 是否显示加载动画（受控）；不传则跟随全局 useLoadingBar 状态 */
  loading?: boolean;
  /** 真实进度（0-100）；传入后显示确定性进度条而非滑动动画 */
  progress?: number;
  /** 是否显示进度百分比文案 */
  showProgress?: boolean;
  /** z-index，默认 var(--z-loading-bar) */
  zIndex?: number | string;
}

/**
 * LoadingBar 组件事件。
 */
export interface LoadingBarEmits {
  /** 点击进度条（预留交互） */
  (e: 'click', event: MouseEvent): void;
}

/** useLoadingBar 配置 */
export interface LoadingBarConfig {
  /** 默认颜色 */
  color?: string;
  /** 默认高度（px） */
  height?: number;
  /** 真实进度模式（默认 false，滑动动画） */
  determinate?: boolean;
}

/** useLoadingBar 返回句柄 */
export interface UseLoadingBarReturn {
  /** 开始加载（显示进度条） */
  start: () => void;
  /** 设置真实进度（0-100），自动切换到确定性模式 */
  setProgress: (value: number) => void;
  /** 结束加载（隐藏进度条并重置进度） */
  finish: () => void;
  /** 直接销毁（同 finish） */
  done: () => void;
  /** 当前是否加载中（只读） */
  isLoading: Readonly<{ value: boolean }>;
  /** 当前进度（0-100，只读） */
  progress: Readonly<{ value: number }>;
  /** 是否处于确定性进度模式 */
  isDeterminate: Readonly<{ value: boolean }>;
}
