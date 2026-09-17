/**
 * calculateRetryDelay 单元测试 — 验证指数退避 + 抖动算法的正确性
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 */

import { describe, it, expect } from 'vitest';
import { calculateRetryDelay } from './retry';

describe('calculateRetryDelay', () => {
  it('固定延迟模式下始终返回 baseDelay', () => {
    const delay = calculateRetryDelay(0, { baseDelay: 500, backoff: 'fixed' });
    expect(delay).toBe(500);
  });

  it('固定延迟模式对任何 attempt 值都返回 baseDelay', () => {
    expect(calculateRetryDelay(3, { baseDelay: 200, backoff: 'fixed' })).toBe(200);
    expect(calculateRetryDelay(10, { baseDelay: 200, backoff: 'fixed' })).toBe(200);
  });

  it('指数退避：attempt=0 时延迟在 [baseDelay*(1-jitter), baseDelay*(1+jitter)] 范围内', () => {
    const baseDelay = 1000;
    const jitter = 0.25;
    // 多次采样验证范围（Math.random 边界抖动）
    for (let i = 0; i < 50; i++) {
      const delay = calculateRetryDelay(0, { baseDelay, backoff: 'exponential', jitter });
      expect(delay).toBeGreaterThanOrEqual(baseDelay * (1 - jitter) - 1);
      expect(delay).toBeLessThanOrEqual(baseDelay * (1 + jitter) + 1);
    }
  });

  it('指数退避：attempt 翻倍时延迟中位数近似翻倍', () => {
    const baseDelay = 1000;
    const noJitter = { baseDelay, backoff: 'exponential' as const, jitter: 0 };
    expect(calculateRetryDelay(0, noJitter)).toBe(1000);
    expect(calculateRetryDelay(1, noJitter)).toBe(2000);
    expect(calculateRetryDelay(2, noJitter)).toBe(4000);
    expect(calculateRetryDelay(3, noJitter)).toBe(8000);
  });

  it('延迟值始终非负', () => {
    for (let attempt = 0; attempt < 10; attempt++) {
      const delay = calculateRetryDelay(attempt, { baseDelay: 10, backoff: 'exponential', jitter: 0.5 });
      expect(delay).toBeGreaterThanOrEqual(0);
    }
  });

  it('返回值类型为整数', () => {
    const delay = calculateRetryDelay(2, { baseDelay: 333, backoff: 'exponential', jitter: 0.1 });
    expect(Number.isInteger(delay)).toBe(true);
  });
});
