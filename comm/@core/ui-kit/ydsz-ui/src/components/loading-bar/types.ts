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
  /** 是否显示加载动画 */
  loading?: boolean;
}

/**
 * LoadingBar 组件事件。
 */
export interface LoadingBarEmits {
  /** 点击进度条（预留交互） */
  (e: 'click', event: MouseEvent): void;
}
