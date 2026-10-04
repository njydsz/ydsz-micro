/**
 * date.ts 工具函数单元测试
 *
 * 覆盖：formatDate / formatDateTime / isDate / isDayjsObject
 *
 * @path comm\@core\base\shared\src\utils\__tests__\date.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import dayjs from 'dayjs';
import { formatDate, formatDateTime, isDate, isDayjsObject } from '../date';

// ---------------------------------------------------------------------------
// formatDate
// ---------------------------------------------------------------------------

describe('formatDate', () => {
  it('应使用默认格式 YYYY-MM-DD 格式化毫秒时间戳', () => {
    const timestamp = 1700000000000; // 2023-11-15
    const result = formatDate(timestamp);
    // 通过 dayjs 验证一致性，避免硬编码受本地时区影响的字面量
    expect(result).toBe(dayjs(timestamp).format('YYYY-MM-DD'));
    expect(typeof result).toBe('string');
  });

  it('应接受自定义格式模板并输出对应格式', () => {
    const timestamp = 1700000000000;
    const result = formatDate(timestamp, 'YYYY/MM/DD');
    expect(result).toBe(dayjs(timestamp).format('YYYY/MM/DD'));
    expect(formatDate(timestamp, 'MM-DD')).toBe(
      dayjs(timestamp).format('MM-DD'),
    );
  });

  it('应能解析并格式化有效的日期字符串', () => {
    const result = formatDate('2023-12-25 14:30:00');
    expect(result).toBe('2023-12-25');
  });

  it('无效日期输入应原样返回入参且不抛异常', () => {
    const invalidInput = 'not-a-date';
    const result = formatDate(invalidInput);
    expect(result).toBe(invalidInput);
    expect(typeof result).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// formatDateTime
// ---------------------------------------------------------------------------

describe('formatDateTime', () => {
  it('应格式化为 YYYY-MM-DD HH:mm:ss 格式', () => {
    const timestamp = 1700000000000;
    const result = formatDateTime(timestamp);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    // 与直接格式化一致，避免时区差异导致字面量失效
    expect(result).toBe(dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss'));
  });

  it('应正确处理午夜时间（00:00:00）', () => {
    // UTC 2023-01-01 00:00:00
    const midnight = 1672531200000;
    const result = formatDateTime(midnight);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  it('应能解析 ISO 8601 字符串并格式化', () => {
    const result = formatDateTime('2024-01-15T10:30:00Z');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  it('无效日期字符串应原样返回', () => {
    const invalid = 'invalid-timestamp';
    const result = formatDateTime(invalid);
    expect(result).toBe(invalid);
  });
});

// ---------------------------------------------------------------------------
// isDate
// ---------------------------------------------------------------------------

describe('isDate', () => {
  it('原生 Date 实例应返回 true', () => {
    expect(isDate(new Date())).toBe(true);
    expect(isDate(new Date('2023-01-01'))).toBe(true);
  });

  it('非 Date 类型应返回 false', () => {
    expect(isDate('2023-01-01')).toBe(false);
    expect(isDate(1700000000000)).toBe(false);
    expect(isDate(null)).toBe(false);
    expect(isDate(undefined)).toBe(false);
    expect(isDate({})).toBe(false);
  });

  it('Invalid Date 实例仍应返回 true（instanceof 不校验有效性）', () => {
    const invalidDate = new Date('not-valid');
    expect(isDate(invalidDate)).toBe(true);
    expect(Number.isNaN(invalidDate.getTime())).toBe(true);
  });

  it('空数组和对象字面量应返回 false', () => {
    expect(isDate([])).toBe(false);
    expect(isDate([new Date()])).toBe(false);
    expect(isDate({ getTime: () => 0 })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isDayjsObject
// ---------------------------------------------------------------------------

describe('isDayjsObject', () => {
  it('dayjs() 实例应返回 true', () => {
    expect(isDayjsObject(dayjs())).toBe(true);
    expect(isDayjsObject(dayjs('2023-01-01'))).toBe(true);
  });

  it('非 dayjs 类型应返回 false', () => {
    expect(isDayjsObject(new Date())).toBe(false);
    expect(isDayjsObject('2023-01-01')).toBe(false);
    expect(isDayjsObject(null)).toBe(false);
    expect(isDayjsObject(undefined)).toBe(false);
  });

  it('空对象和仿 dayjs 结构的字面量应返回 false', () => {
    expect(isDayjsObject({})).toBe(false);
     
    expect(isDayjsObject({ $d: new Date(), $y: 2023 })).toBe(false);
  });

  it('不同 dayjs 派生实例（如 dayjs().startOf）应返回 true', () => {
    const derived = dayjs().startOf('day');
    expect(isDayjsObject(derived)).toBe(true);
    expect(derived.isValid()).toBe(true);
  });
});
