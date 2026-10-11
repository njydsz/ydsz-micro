/**
 * Progress 组件的 props 类型。
 *
 * @author ydsz-team
 * @since 1.0.0
 */

/**
 * Progress 组件类型（形态）：
 * - linear: 线性进度条
 * - circle: 圆形进度环
 * - dashboard: 仪表盘进度（半圆）
 */
export type ProgressType = 'linear' | 'circle' | 'dashboard';

/**
 * Progress 组件属性。
 *
 * 统一的 Progress 入口，根据 `type` 渲染不同形态。
 */
export interface ProgressProps {
  /** 进度类型（默认 linear） */
  type?: ProgressType;
  /** 当前进度值（0-100） */
  value?: number;
  /**
   * 自定义类名。
   *
   * 在当前组件上合并，最终会注入到对应 primitives 组件。
   */
  class?: any;
  /** 线性：进度条高度覆盖 */
  barClass?: string;
  /** 线性：是否显示不确定进度（循环动画） */
  indeterminate?: boolean;

  /** circle/dashboard：画布尺寸（px；linear 下为条高度） */
  size?: number;
  /** circle/dashboard：线条宽度（px） */
  strokeWidth?: number;
  /** circle/dashboard：指示器颜色 */
  color?: string;
  /** circle/dashboard：轨道颜色 */
  trackColor?: string;
  /** circle/dashboard：是否显示百分比文本 */
  showInfo?: boolean;
}

/**
 * Progress 组件事件。
 */
export interface ProgressEmits {
  /** 进度条完成（到达 100%）时触发 */
  done: [];
}
