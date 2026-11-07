/**
 * 指数退避重试工具测试
 *
 * @path comm\effects\micro-kernel\src\retry.test.ts
 * @author ydsz-team
 * @since 26.11.07
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { calculateRetryDelay, retryOperation } from './retry';

describe('retry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('calculateRetryDelay', () => {
    it('无抖动时按指数增长', () => {
      expect(calculateRetryDelay(0, 500, 0)).toBe(500);
      expect(calculateRetryDelay(1, 500, 0)).toBe(1000);
      expect(calculateRetryDelay(2, 500, 0)).toBe(2000);
    });

    it('抖动结果落在 [raw*(1-j), raw*(1+j)] 区间内', () => {
      const base = 500;
      const jitter = 0.25;
      for (let attempt = 0; attempt < 4; attempt++) {
        for (let i = 0; i < 20; i++) {
          const delay = calculateRetryDelay(attempt, base, jitter);
          const raw = base * 2 ** attempt;
          expect(delay).toBeGreaterThanOrEqual(raw * (1 - jitter) - 1);
          expect(delay).toBeLessThanOrEqual(raw * (1 + jitter) + 1);
        }
      }
    });
  });

  describe('retryOperation', () => {
    it('首次成功时不重试', async () => {
      const fn = vi.fn().mockResolvedValue('ok');
      const onRetry = vi.fn();

      const result = await retryOperation(fn, {
        maxRetries: 3,
        baseDelay: 10,
        backoff: 'exponential',
        onRetry,
      });

      expect(result).toBe('ok');
      expect(fn).toHaveBeenCalledTimes(1);
      expect(onRetry).not.toHaveBeenCalled();
    });

    it('失败后重试直至成功', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail-1'))
        .mockRejectedValueOnce(new Error('fail-2'))
        .mockResolvedValue('ok');
      const onRetry = vi.fn();

      const promise = retryOperation(fn, {
        maxRetries: 3,
        baseDelay: 10,
        backoff: 'exponential',
        onRetry,
      });

      // 推进虚拟时钟以触发退避 sleep
      await vi.runAllTimersAsync();

      await expect(promise).resolves.toBe('ok');
      expect(fn).toHaveBeenCalledTimes(3);
      expect(onRetry).toHaveBeenCalledTimes(2);
    });

    it('重试耗尽后抛出最后一次异常', async () => {
      const lastError = new Error('final');
      const fn = vi.fn().mockRejectedValue(lastError);

      const promise = retryOperation(fn, {
        maxRetries: 2,
        baseDelay: 10,
        backoff: 'exponential',
      });
      // 消费 rejection，避免未处理 Promise 警告
      const assertion = expect(promise).rejects.toBe(lastError);
      await vi.runAllTimersAsync();
      await assertion;

      // 首次 + 2 次重试
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('maxRetries=0 时不重试', async () => {
      const error = new Error('boom');
      const fn = vi.fn().mockRejectedValue(error);

      await expect(
        retryOperation(fn, { maxRetries: 0, baseDelay: 10, backoff: 'exponential' }),
      ).rejects.toBe(error);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('onRetry 收到 (error, attempt, delay)', async () => {
      const error = new Error('boom');
      const fn = vi.fn().mockRejectedValueOnce(error).mockResolvedValue('ok');
      const onRetry = vi.fn();

      const promise = retryOperation(fn, {
        maxRetries: 1,
        baseDelay: 100,
        backoff: 'exponential',
        jitter: 0,
        onRetry,
      });

      await vi.runAllTimersAsync();
      await promise;

      expect(onRetry).toHaveBeenCalledTimes(1);
      const [err, attempt, delay] = onRetry.mock.calls[0]!;
      expect(err).toBe(error);
      expect(attempt).toBe(0);
      expect(delay).toBe(100);
    });

    it('支持同步返回值的函数', async () => {
      const fn = vi.fn().mockReturnValue(42);

      await expect(
        retryOperation(fn, { maxRetries: 1, baseDelay: 10, backoff: 'exponential' }),
      ).resolves.toBe(42);
    });
  });
});
