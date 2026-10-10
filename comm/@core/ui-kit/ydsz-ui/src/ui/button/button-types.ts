/**
 * Button 组件的 props 类型。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\button\button-types.ts
 * @author ydsz-team
 * @since 26.09.24
 */

/** 按钮视觉变体 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

/** 按钮尺寸 */
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Button 组件属性。
 */
export interface ButtonProps {
  /** 自定义 CSS class */
  class?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否可见（受控模式） */
  open?: boolean;
  /** 视觉变体 @default 'primary' */
  variant?: ButtonVariant;
  /** 尺寸 @default 'md' */
  size?: ButtonSize;
}

/**
 * Button 组件事件。
 */
export interface ButtonEmits {
  /** open 变化回调 */
  (e: 'update:open', value: boolean): void;
  /** 确认回调 */
  (e: 'confirm'): void;
  /** 取消回调 */
  (e: 'cancel'): void;
}
