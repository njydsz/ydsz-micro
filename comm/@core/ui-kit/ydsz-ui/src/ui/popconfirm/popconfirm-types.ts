/**
 * Popconfirm 气泡确认框组件的 props 类型。
 *
 * @author ydsz-ai
 * @since 1.0.0
 */

/**
 * Popconfirm 组件属性。
 *
 * 气泡确认框——在 Popover 中嵌入确认/取消按钮，用于删除等不可逆操作。
 */
export interface PopconfirmProps {
  /** 自定义 CSS class */
  class?: string;
  /** 确认框标题 */
  title?: string;
  /** 确认按钮文字 */
  confirmText?: string;
  /** 取消按钮文字 */
  cancelText?: string;
  /** 确认按钮类型 */
  confirmVariant?: 'primary' | 'danger' | 'default';
  /** 是否禁用 */
  isDisabled?: boolean;
  /** 是否显示 */
  open?: boolean;
  /** 是否加载中 */
  isLoading?: boolean;
  /** 图标 */
  icon?: string;
  /** 触发方式 */
  trigger?: 'click' | 'hover' | 'focus';
}

/**
 * Popconfirm 组件事件。
 */
export interface PopconfirmEmits {
  /** open 变化回调 */
  (e: 'update:open', value: boolean): void;
  /** 确认回调 */
  (e: 'confirm'): void;
  /** 取消回调 */
  (e: 'cancel'): void;
}
