/**
 * YdDatePicker 支持的类型。
 *
 * - `date`：选择单个日期（YYYY-MM-DD）
 * - `datetime`：选择单个日期（YYYY-MM-DD HH:mm，当前仅保留日期部分）
 * - `range`：选择日期范围，v-model 为 `[开始, 结束]` 元组
 */
export type DatePickerType = 'datetime' | 'date' | 'range';

/**
 * YdDatePicker 的 v-model 值形态。
 *
 * 单模式为日期字符串；range 模式为 `[开始, 结束]` 二元组，两个元素均为
 * `YYYY-MM-DD` 字符串且开始不晚于结束。
 */
export type DatePickerValue = string | readonly [string, string];
