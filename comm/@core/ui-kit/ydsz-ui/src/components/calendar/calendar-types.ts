/**
 * Calendar 日历组件的 props 类型。
 *
 * @author ydsz-ai
 * @since 1.0.0
 */

/**
 * Calendar 组件属性。
 *
 * 日历选择面板——展示月历，支持日期点选、范围选择、禁用日期、自定义日期单元格。
 */
export interface CalendarProps {
  /** 自定义 CSS class */
  class?: string;
  /** 是否范围选择 */
  isRange?: boolean;
  /** 是否多选 */
  multiple?: boolean;
  /** 是否禁用 */
  isDisabled?: boolean;
  /** 不可选日期的判断函数 */
  disabledDate?: (date: Date) => boolean;
  /** 是否显示今日 */
  showToday?: boolean;
  /** 国际化对象 */
  locale?: string;
  /** 日期格式 */
  valueFormat?: string;
}

/**
 * Calendar 组件事件。
 */
export interface CalendarEmits {
  /** 选中日期变化 */
  (e: 'update:value', value: Date | Date[] | undefined): void;
  /** 面板月份切换 */
  (e: 'panelChange', date: Date): void;
}

/** 日历视图模式 */
export type CalendarMode = 'month' | 'year';
