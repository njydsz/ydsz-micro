/**
 * Affix 组件的 props 类型。
 *
 * @author ydsz-ai
 * @since 1.0.0
 */

/**
 * Affix 组件属性。
 *
 * 固钉组件——在滚动到指定偏移量时将内容固定到视口或容器内。
 */
export interface AffixProps {
  /** 自定义 CSS class */
  class?: string;
  /** 固定方向：top | bottom，默认 top */
  position?: 'top' | 'bottom';
  /** 距离视图顶部/底部的偏移量，默认 0 */
  offset?: number;
  /** 监听滚动的目标元素，默认 window */
  target?: string;
  /** z-index 层级 */
  zIndex?: number;
}

/**
 * Affix 组件事件。
 */
export interface AffixEmits {
  /** 固定状态变化回调 */
  (e: 'change', isFixed: boolean): void;
}
