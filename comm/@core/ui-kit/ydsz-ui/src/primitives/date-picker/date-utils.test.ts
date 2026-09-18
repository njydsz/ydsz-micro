/**
 * DatePicker 纯函数工具测试。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\date-picker\date-utils.test.ts
 * @author ydsz-team
 * @since 5.6.0
 */
import { describe, expect, it } from 'vitest';

import {
  daysInMonth,
  endOfQuarter,
  endOfWeek,
  endOfYear,
  formatByGrain,
  formatDate,
  formatMonth,
  getISOWeek,
  isLeapYear,
  parseByGrain,
  parseDate,
  parseISOWeek,
  startOfQuarter,
  startOfWeek,
  startOfYear,
} from './date-utils';

describe('date-utils', () => {
  it('isLeapYear 应正确判断闰年', () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2026)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(1900)).toBe(false);
  });

  it('daysInMonth 应返回每月正确天数', () => {
    expect(daysInMonth(2026, 1)).toBe(31);
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2026, 4)).toBe(30);
  });

  it('parseDate / formatDate 应互逆', () => {
    const d = parseDate('2026-09-18');
    expect(d).not.toBeNull();
    expect(formatDate(d!)).toBe('2026-09-18');

    expect(parseDate('invalid')).toBeNull();
    expect(parseDate('')).toBeNull();
  });

  it('formatMonth 应返回 YYYY-MM', () => {
    const d = new Date(2026, 8, 18);
    expect(formatMonth(d)).toBe('2026-09');
  });

  it('startOfWeek / endOfWeek 应对齐周一 ~ 周日', () => {
    // 2026-09-18 是周五
    const d = new Date(2026, 8, 18);
    const mon = startOfWeek(d);
    const sun = endOfWeek(d);
    expect(mon.getDay()).toBe(1); // 周一
    expect(sun.getDay()).toBe(0); // 周日
    expect(formatDate(mon)).toBe('2026-09-14');
    expect(formatDate(sun)).toBe('2026-09-20');
  });

  it('ISO 周数应正确计算', () => {
    const d = new Date(2026, 0, 1); // 2026-01-01 周四
    const week = getISOWeek(d);
    expect(week).toMatch(/^2026-W\d{2}$/);

    // parseISOWeek 应返回周一
    const mon = parseISOWeek(week);
    expect(mon).not.toBeNull();
    expect(mon!.getDay()).toBe(1);
  });

  it('parseISOWeek 应拒绝非法输入', () => {
    expect(parseISOWeek('2026-W00')).toBeNull();
    expect(parseISOWeek('2026-W54')).toBeNull();
    expect(parseISOWeek('invalid')).toBeNull();
  });

  it('startOfQuarter / endOfQuarter 应对齐季度边界', () => {
    // Q1: 1-3月
    const q1 = new Date(2026, 1, 15);
    expect(formatDate(startOfQuarter(q1))).toBe('2026-01-01');
    expect(formatDate(endOfQuarter(q1))).toBe('2026-03-31');

    // Q3: 7-9月
    const q3 = new Date(2026, 7, 15);
    expect(formatDate(startOfQuarter(q3))).toBe('2026-07-01');
    expect(formatDate(endOfQuarter(q3))).toBe('2026-09-30');
  });

  it('startOfYear / endOfYear 应对齐年度边界', () => {
    const d = new Date(2026, 5, 15);
    expect(formatDate(startOfYear(d))).toBe('2026-01-01');
    expect(formatDate(endOfYear(d))).toBe('2026-12-31');
  });

  it('formatByGrain 应按粒度格式化', () => {
    const d = new Date(2026, 8, 18);
    expect(formatByGrain(d, 'date')).toBe('2026-09-18');
    expect(formatByGrain(d, 'month')).toBe('2026-09');
    expect(formatByGrain(d, 'year')).toBe('2026');
    expect(formatByGrain(d, 'quarter')).toBe('2026-Q3');
    expect(formatByGrain(d, 'week')).toMatch(/^2026-W\d{2}$/);
  });

  it('parseByGrain 应按粒度解析', () => {
    expect(formatDate(parseByGrain('2026-Q2', 'quarter')!)).toBe('2026-04-01');
    expect(formatDate(parseByGrain('2026-06', 'month')!)).toBe('2026-06-01');
    expect(formatDate(parseByGrain('2030', 'year')!)).toBe('2030-01-01');
  });
});
