/**
 * Skeleton 组件的 props / emits 类型定义。
 *
 * @author ydsz-ai
 * @since 1.0.0
 */

/**
 * Skeleton 变体类型。
 *
 * - `text`：单行文本占位
 * - `avatar`：头像占位（圆形/方形）
 * - `title`：标题占位
 * - `paragraph`：段落占位（多行）
 * - `button`：按钮占位
 * - `image`：图片占位
 */
export type SkeletonVariant =
  | 'text'
  | 'avatar'
  | 'title'
  | 'paragraph'
  | 'button'
  | 'image';

/** Skeleton 尺寸预设。 */
export type SkeletonSize = 'small' | 'medium' | 'large';

/** Skeleton 组件属性。 */
export interface SkeletonProps {
  /** 自定义 CSS class。 */
  class?: string;
  /** 变体类型，默认 `text`。 */
  variant?: SkeletonVariant;
  /** 是否开启动画，默认 `true`。 */
  animated?: boolean;
  /** 段落模式下重复行数，默认 `3`。 */
  repeat?: number;
  /** 是否圆角（用于文本/标题占位）。 */
  round?: boolean;
  /** 是否圆形（用于头像占位）。 */
  circle?: boolean;
  /** 尺寸预设。 */
  size?: SkeletonSize;
  /** 自定义宽度（支持 CSS 字符串或像素数值）。 */
  width?: string | number;
  /** 自定义高度（支持 CSS 字符串或像素数值）。 */
  height?: string | number;
  /** 行内样式覆盖。 */
  style?: Record<string, string>;
}
