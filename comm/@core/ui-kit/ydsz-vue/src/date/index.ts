/**
 * 日期工具 — 对齐 radix-vue / reka-ui 的 src/date 模块。
 *
 * vendored 源码中该目录缺失，导致 shared/useDateFormatter 等引用 '@/date' 无法解析。
 * 此处补齐 hasTime / isZonedDateTime / toDate 三个被消费的助手函数，
 * 并原样转发 @internationalized/date 的全部导出。
 *
 * @path comm/@core/ui-kit/ydsz-vue/src/date/index.ts
 * @since 5.1.0
 */

export * from '@internationalized/date'

import {
  getLocalTimeZone,
  ZonedDateTime,
  type DateValue,
} from '@internationalized/date'

/** Intl.DateTimeFormatOptions 中的时区（缺省回退到本地时区） */
export function getTimeZone(
  dateTimeFormatOptions: Intl.DateTimeFormatOptions = {},
): string {
  return dateTimeFormatOptions.timeZone ?? getLocalTimeZone()
}

/**
 * 判断日期（原生 Date 或 DateValue）是否携带非零时间部分。
 *
 * 兼容两类入参：
 * - 原生 Date：检查 h/m/s/ms
 * - @internationalized/date 的 DateValue：检查 hour/minute/second/millisecond 字段
 */
export function hasTime(date: Date | DateValue): boolean {
  if (typeof (date as Date).getHours === 'function') {
    const d = date as Date
    return !(
      d.getHours() === 0
      && d.getMinutes() === 0
      && d.getSeconds() === 0
      && d.getMilliseconds() === 0
    )
  }
  const v = date as DateValue
  return !(
    v.hour === 0
    && v.minute === 0
    && v.second === 0
    && v.millisecond === 0
  )
}

/** 判断是否为 @internationalized/date 的 ZonedDateTime 实例 */
export function isZonedDateTime(date: unknown): date is ZonedDateTime {
  return date instanceof ZonedDateTime
}

/**
 * DateValue（或数组）→ 原生 Date。
 * ZonedDateTime 自带时区直接 toDate；其余按 options.timeZone（缺省本地时区）换算。
 */
export function toDate(
  dateValue: DateValue | DateValue[],
  dateTimeFormatOptions: Intl.DateTimeFormatOptions = {},
): Date | Date[] {
  if (Array.isArray(dateValue)) {
    return dateValue.map(v => toDate(v, dateTimeFormatOptions) as Date)
  }
  if (isZonedDateTime(dateValue)) {
    return dateValue.toDate()
  }
  return dateValue.toDate(getTimeZone(dateTimeFormatOptions))
}
