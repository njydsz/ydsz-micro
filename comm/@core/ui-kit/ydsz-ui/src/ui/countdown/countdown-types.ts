/**
 * Countdown 组件的 props 类型。
 *
 * @author ydsz-ai
 * @since 1.0.0
 */

/** 格式化模板支持的时间标记。 */
export type CountdownFormatToken = 'DD' | 'HH' | 'mm' | 'ss' | 'SSS';

/** 倒计时各时间分量。 */
export interface CountdownTime {
  /** 天 */
  days: number;
  /** 时 */
  hours: number;
  /** 分 */
  minutes: number;
  /** 秒 */
  seconds: number;
  /** 毫秒 */
  milliseconds: number;
}

/**
 * Countdown 组件属性。
 */
export interface CountdownProps {
  /** 自定义 CSS class */
  class?: string;
  /** 目标结束时间戳（毫秒）或 Date 对象 */
  value?: number | Date;
  /** 格式化模板，默认 'HH:mm:ss'，支持 DD / HH / mm / ss / SSS */
  format?: string;
  /** 前缀文字 */
  prefix?: string;
  /** 后缀文字 */
  suffix?: string;
  /** 标题 */
  title?: string;
  /** 数值自定义样式 */
  valueStyle?: Record<string, string>;
}

/**
 * Countdown 组件事件。
 */
export interface CountdownEmits {
  /** 倒计时归零时触发 */
  (e: 'finish'): void;
  /** 倒计时每次变化时触发（传入时间分量对象） */
  (e: 'change', time: CountdownTime): void;
}
