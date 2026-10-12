/**
 * Select 组件的 props 类型。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\select\select-types.ts
 * @author ydsz-team
 * @since 26.09.24
 */

/** 选择器尺寸 */
export type SelectSize = 'sm' | 'md' | 'lg';

/** 选择器变体 */
export type SelectVariant = 'outline' | 'filled';

/**
 * Select 组件属性。
 */
export interface SelectProps {
  /** 自定义 CSS class */
  class?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否可见（受控模式） */
  open?: boolean;
  /** 占位符文本 */
  placeholder?: string;
  /** 视觉变体 @default 'outline' */
  variant?: SelectVariant;
  /** 尺寸 @default 'md' */
  size?: SelectSize;
  /** ARIA 标签，为屏幕阅读器提供可访问名称 */
  ariaLabel?: string;
  /** 与 ariaLabel 互斥：引用外部标签元素的 id */
  ariaLabelledby?: string;
  /** 显式设置 aria-controls 引用的 id（listbox），默认自动使用 options id */
  ariaControls?: string;
  /** 当前激活（高亮）选项的 id，用于 aria-activedescendant */
  ariaActivedescendant?: string;
  /** 多选模式：向原生 select 写入 multiple 并设置 aria-multiselectable */
  multiple?: boolean;
}

/**
 * Select 组件事件。
 */
export interface SelectEmits {
  /** open 变化回调 */
  (e: 'update:open', value: boolean): void;
  /** 确认回调 */
  (e: 'confirm'): void;
  /** 取消回调 */
  (e: 'cancel'): void;
}
