/**
 * DatePicker 纯函数工具集 —— 无 Vue、无 dayjs 依赖，可独立测试。
 *
 * 提供解析 / 格式化 / startOf / endOf / 周对齐 / 粒度切换，
 * 涵盖 date、week、month、quarter、year 全粒度。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\date-picker\date-utils.ts
 * @author ydsz-team
 * @since 5.6.0
 */
import type { DatePickerType } from './types';

/** 判断是否为闰年 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** 获取某月的天数 */
export function daysInMonth(year: number, month: number): number {
  // month: 1-12
  const days = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return days[month - 1] ?? 30;
}

/** 解析 'YYYY-MM-DD' 字符串为 Date */
export function parseDate(input: string | undefined | null): Date | null {
  if (!input) return null;
  const match = input.match(/^(\d{4})-?(\d{2})?-?(\d{2})?/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2] ?? '01');
  const day = Number(match[3] ?? '01');
  const d = new Date(year, month - 1, day);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

/** 格式化为 YYYY-MM-DD */
export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 格式化为 YYYY-MM */
export function formatMonth(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** 格式化为 YYYY */
export function formatYear(d: Date): string {
  return `${d.getFullYear()}`;
}

/**
 * ISO 8601 周数计算。
 * 返回 'YYYY-WNN' 格式的 ISO 周标识。
 */
export function getISOWeek(d: Date): string {
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // 调整到最近的周四（ISO 周定义）
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const firstDayNr = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNr + 3);
  const weekNo = 1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * 24 * 3600 * 1000));
  return `${target.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/** 解析 ISO 周字符串 'YYYY-WNN' 为周一的 Date */
export function parseISOWeek(input: string): Date | null {
  const match = input.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const week = Number(match[2]);
  if (week < 1 || week > 53) return null;

  // ISO 年的 1 月 4 日一定在第一周
  const jan4 = new Date(year, 0, 4);
  const jan4Day = (jan4.getDay() + 6) % 7; // 周一为 0
  const mondayWeek1 = new Date(jan4);
  jan4.setDate(jan4.getDate() - jan4Day);

  const result = new Date(jan4);
  result.setDate(result.getDate() + (week - 1) * 7);
  return result;
}

/** 获取某日期所在周的周一 */
export function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // 周一为 0
  date.setDate(date.getDate() - day);
  return date;
}

/** 获取某日期所在周的周日 */
export function endOfWeek(d: Date): Date {
  const mon = startOfWeek(d);
  const sun = new Date(mon);
  sun.setDate(sun.getDate() + 6);
  return sun;
}

/** 获取某日期所在月份 1 号 */
export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** 获取某日期所在月份最后一天 */
export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

/** 获取某日期所在季度的起始月 1 号 */
export function startOfQuarter(d: Date): Date {
  const quarterStartMonth = Math.floor(d.getMonth() / 3) * 3;
  return new Date(d.getFullYear(), quarterStartMonth, 1);
}

/** 获取某日期所在季度最后一个月最后一天 */
export function endOfQuarter(d: Date): Date {
  const quarterStartMonth = Math.floor(d.getMonth() / 3) * 3;
  return new Date(d.getFullYear(), quarterStartMonth + 3, 0);
}

/** 获取某年的 1 月 1 日 */
export function startOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 0, 1);
}

/** 获取某年的 12 月 31 日 */
export function endOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 11, 31);
}

/** 按粒度提取显示值（Date => string） */
export function formatByGrain(d: Date, grain: DatePickerType): string {
  switch (grain) {
    case 'year':
    case 'yearrange':
      return formatYear(d);
    case 'quarter':
      return `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`;
    case 'month':
    case 'monthrange':
      return formatMonth(d);
    case 'week':
      return getISOWeek(d);
    default:
      return formatDate(d);
  }
}

/** 解析字符串为 Date（按粒度的最简形式） */
export function parseByGrain(input: string, grain: DatePickerType): Date | null {
  if (grain === 'week') return parseISOWeek(input);
  if (grain === 'month' || grain === 'monthrange') {
    const d = parseDate(`${input}-01`);
    return d ? startOfMonth(d) : null;
  }
  if (grain === 'year' || grain === 'yearrange') {
    return parseDate(`${input}-01-01`);
  }
  if (grain === 'quarter') {
    const m = input.match(/^(\d{4})-Q([1-4])$/);
    if (!m) return null;
    const month = (Number(m[2]) - 1) * 3;
    return new Date(Number(m[1]), month, 1);
  }
  return parseDate(input);
}

/** 计算粒度对应的 startOf 函数 */
export function startOfByGrain(d: Date, grain: DatePickerType): Date {
  switch (grain) {
    case 'week':
      return startOfWeek(d);
    case 'quarter':
      return startOfQuarter(d);
    case 'month':
    case 'monthrange':
      return startOfMonth(d);
    case 'year':
    case 'yearrange':
      return startOfYear(d);
    default:
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
}

/** 计算粒度对应的 endOf 函数 */
export function endOfByGrain(d: Date, grain: DatePickerType): Date {
  switch (grain) {
    case 'week':
      return endOfWeek(d);
    case 'quarter':
      return endOfQuarter(d);
    case 'month':
    case 'monthrange':
      return endOfMonth(d);
    case 'year':
    case 'yearrange':
      return endOfYear(d);
    default:
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
}
