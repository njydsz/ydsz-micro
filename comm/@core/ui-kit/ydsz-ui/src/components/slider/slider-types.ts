/**
 * Slider 组件的 props 类型。
 *
 * @author ydsz-ai
 * @since 1.0.0
 */

/**
 * Slider 组件属性。
 */
export interface SliderProps {
  /** 自定义 CSS class */
  class?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 当前值（单值模式） */
  modelValue?: number;
  /** 当前值（双值 range 模式：[min, max]） */
  modelValueRange?: [number, number];
  /** 最小值 @default 0 */
  min?: number;
  /** 最大值 @default 100 */
  max?: number;
  /** 步进值 @default 1 */
  step?: number;
  /** 是否启用 range 双滑块模式 */
  range?: boolean;
  /** ARIA 标签 */
  ariaLabel?: string;
  /** 引用外部标签元素的 id */
  ariaLabelledby?: string;
  /** aria-valuetext 格式化函数输入：当前值 */
}

/**
 * Slider 组件事件。
 */
export interface SliderEmits {
  /** 值变化回调（单值） */
  (e: 'update:modelValue', value: number): void;
  /** 值变化回调（range 双值） */
  (e: 'update:modelValueRange', value: [number, number]): void;
  /** 拖拽/键盘交互结束 */
  (e: 'change', value: number | [number, number]): void;
}
