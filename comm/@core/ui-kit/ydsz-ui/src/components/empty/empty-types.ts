/**
 * Empty 组件的 props 类型。
 *
 * @author ydsz-ai
 * @since 1.0.0
 */

/**
 * Empty 组件属性。
 */
export interface EmptyProps {
  /** 自定义 CSS class */
  class?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否可见（受控模式） */
  open?: boolean;
}

/**
 * Empty 组件事件。
 */
export interface EmptyEmits {
  /** open 变化回调 */
  (e: 'update:open', value: boolean): void;
  /** 确认回调 */
  (e: 'confirm'): void;
  /** 取消回调 */
  (e: 'cancel'): void;
}
