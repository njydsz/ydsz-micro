/**
 * AvatarGroup 组件的 props 类型。
 *
 * @author ydsz-team
 * @since 1.0.0
 */

/**
 * 单个头像条目数据。
 */
export interface AvatarItem {
  /** 名称（用于 tooltip、fallback 首字母、popover 列表） */
  name?: string;
  /** 头像图片地址 */
  src?: string;
  /** 自定义 fallback 文本（不传则取 name 首字母） */
  fallback?: string;
}

/**
 * AvatarGroup 组件属性。
 */
export interface AvatarGroupProps {
  /** 头像数据列表 */
  items: AvatarItem[];
  /** 最大显示数，超出部分以 +N 折叠并以 Popover 展示 */
  maxCount?: number;
  /** Popover 触发方式（默认 hover） */
  maxPopoverTrigger?: 'click' | 'hover';
  /** 头像尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 是否重叠排列（默认 true） */
  overlap?: boolean;
  /** 自定义 CSS class */
  class?: any;
}

/**
 * AvatarGroup 组件事件。
 */
export interface AvatarGroupEmits {
  /** 折叠区域（+N）被点击时触发 */
  overflowClick: [count: number];
}
