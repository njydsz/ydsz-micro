/**
 * TimePicker 时间选择器组件的 props 类型。
 *
 * @author ydsz-ai
 * @since 1.0.0
 */

/**
 * TimePicker 组件属性。
 *
 * 时间选择器——点击输入框弹出面板选择时分秒，支持12/24小时制、格式化、清除。
 */
export interface TimePickerProps {
  /** 自定义 CSS class */
  class?: string;
  /** 是否禁用 */
  isDisabled?: boolean;
  /** 是否只读 */
  isReadonly?: boolean;
  /** 是否允许清除 */
  allowClear?: boolean;
  /** 占位文字 */
  placeholder?: string;
  /** 12小时制 */
  use12Hours?: boolean;
  /** 是否显示秒 */
  showSecond?: boolean;
  /** 格式化模板，默认 HH:mm:ss */
  format?: string;
  /** 小时步长 */
  hourStep?: number;
  /** 分钟步长 */
  minuteStep?: number;
  /** 秒步长 */
  secondStep?: number;
  /** 是否只读输入 */
  readonly?: boolean;
}

/**
 * TimePicker 组件事件。
 */
export interface TimePickerEmits {
  /** 时间变化 */
  (e: 'update:value', value: string | undefined): void;
  /** 面板展开/收起 */
  (e: 'open', isOpen: boolean): void;
}

/** 时间内部状态 */
export interface TimePickerState {
  /** 选中的小时 */
  hour: number;
  /** 选中的分钟 */
  minute: number;
  /** 选中的秒 */
  second: number;
  /** 上午/下午 (use12Hours 时) */
  period: 'AM' | 'PM';
}
