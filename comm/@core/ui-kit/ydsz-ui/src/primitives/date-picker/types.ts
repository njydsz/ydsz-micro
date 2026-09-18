/**
 * YdDatePicker 支持的日期粒度（对标 Element Plus / Naive UI DatePicker）。
 *
 * <p>扩展后共 10 种粒度（含 range 变体），覆盖高频业务场景：
 * <ul>
 *   <li>date / datetime：单选日期</li>
 *   <li>week：选择某一周（周一 ~ 周日）</li>
 *   <li>month：选择某月（不回显日）</li>
 *   <li>quarter：选择某季度</li>
 *   <li>year：选择某年</li>
 *   <li>daterange / weekrange / monthrange / yearrange：范围选择</li>
 * </ul>
 */
export type DatePickerType =
  | 'datetime'
  | 'date'
  | 'week'
  | 'month'
  | 'quarter'
  | 'year'
  | 'daterange'
  | 'datetimerange'
  | 'monthrange'
  | 'yearrange';

/**
 * 是否为范围模式。
 */
export function isRangeType(type: DatePickerType): boolean {
  return type.endsWith('range');
}

/**
 * 解析 range 类型对应的基础粒度。
 */
export function resolveRangeBase(type: DatePickerType): DatePickerType {
  if (type === 'daterange') return 'date';
  if (type === 'datetimerange') return 'datetime';
  if (type === 'monthrange') return 'month';
  if (type === 'yearrange') return 'year';
  return type;
}

/**
 * YdDatePicker 的 v-model 值形态。
 *
 * <p>单模式为字符串（具体格式视粒度而定）；
 * range 模式为 `[开始, 结束]` 二元组。
 * <ul>
 *   <li>date / datetime：`YYYY[-MM-DD[-HHmm]]`</li>
 *   <li>week：`YYYY-WNN`（如 2026-W01）</li>
 *   <li>month：`YYYY-MM`</li>
 *   <li>quarter：`YYYY-QN`（如 2026-Q1）</li>
 *   <li>year：`YYYY`</li>
 * </ul>
 */
export type DatePickerValue = string | readonly [string, string];

/**
 * 快捷项。
 */
export interface DatePickerShortcut {
  /** 展示文本 */
  text: string;
  /** 点击后返回的 v-model 值 */
  value: () => DatePickerValue | undefined;
}
