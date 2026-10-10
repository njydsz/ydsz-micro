/**
 * Input 组件的 props 类型。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\input\input-types.ts
 * @author ydsz-team
 * @since 26.09.24
 */

/** 输入框尺寸 */
export type InputSize = 'sm' | 'md' | 'lg';

/** 输入框变体 */
export type InputVariant = 'outline' | 'filled' | 'flushed';

/**
 * Input 组件属性。
 */
export interface InputProps {
  /** 自定义 CSS class */
  class?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否可见（受控模式） */
  open?: boolean;
  /** input v-model 绑定值 */
  modelValue?: string;
  /** 占位符文本 */
  placeholder?: string;
  /** 原生 type @default 'text' */
  type?: string;
  /** 视觉变体 @default 'outline' */
  variant?: InputVariant;
  /** 尺寸 @default 'md' */
  size?: InputSize;
}

/**
 * Input 组件事件。
 */
export interface InputEmits {
  /** open 变化回调 */
  (e: 'update:open', value: boolean): void;
  /** 确认回调 */
  (e: 'confirm'): void;
  /** 取消回调 */
  (e: 'cancel'): void;
  /** modelValue 变化 */
  (e: 'update:modelValue', value: string): void;
}
