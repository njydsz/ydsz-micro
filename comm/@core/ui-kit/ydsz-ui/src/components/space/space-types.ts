/**
 * Space 组件的 props 类型。
 *
 * @author ydsz-team
 * @since 1.0.0
 */

/**
 * 间距大小：
 * - number: 数值（自动转 px），例如 8 表示 gap: 8px
 * - string: 带单位的 CSS 值，例如 '8px'、'1rem'
 * - [number, number]: 二维数组 [水平间距, 垂直间距]（px），用于独立的行列间距
 */
export type SpaceSize = number | string | [number, number];

/**
 * Space 组件属性。
 *
 * 对标 Naive UI n-space。
 */
export interface SpaceProps {
  /** 间距大小（默认 8px；支持 [水平, 垂直] 二维数组） */
  size?: SpaceSize;
  /** 排列方向（默认 horizontal） */
  direction?: 'horizontal' | 'vertical';
  /** 交叉轴对齐方式（默认 undefined，继承 flex 默认值 stretch） */
  align?: 'start' | 'center' | 'end' | 'baseline' | 'stretch';
  /** 是否自动换行（默认 false） */
  wrap?: boolean;
  /** 子元素等宽填满容器（默认 false） */
  fill?: boolean;
  /** 自定义 CSS class */
  class?: any;
}
