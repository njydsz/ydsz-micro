/**
 * 降级与重试状态管理测试
 *
 * 覆盖三级降级决策（auto-retry → show-ui → full-page）、降级标记生命周期、
 * 重试计数器与 error-boundary 管理器的清理语义。
 *
 * @path comm\effects\micro-kernel\src\error-degradation.test.ts
 * @author ydsz-team
 * @since 26.11.07
 */

import { afterEach, describe, expect, it } from 'vitest';

import {
  MAX_MICRO_RETRIES,
  clearDegraded,
  createErrorBoundaryManager,
  decideDegradationLevel,
  getNextAutoRetryDelay,
  getRetryCount,
  isDegraded,
  markDegraded,
  resetRetryCount,
  setRetryCount,
  unmarkDegraded,
} from './error-degradation';

describe('error-degradation', () => {
  afterEach(() => {
    // 模块级单例状态必须在每个用例后清理，避免用例间串扰
    clearDegraded();
    resetRetryCount('test-app');
  });

  describe('降级标记', () => {
    it('markDegraded / isDegraded 基本语义', () => {
      expect(isDegraded('test-app')).toBe(false);

      markDegraded('test-app');

      expect(isDegraded('test-app')).toBe(true);
    });

    it('unmarkDegraded 单独清除指定应用', () => {
      markDegraded('app-a');
      markDegraded('app-b');

      unmarkDegraded('app-a');

      expect(isDegraded('app-a')).toBe(false);
      expect(isDegraded('app-b')).toBe(true);
    });

    it('clearDegraded 清空全部标记', () => {
      markDegraded('app-a');
      markDegraded('app-b');

      clearDegraded();

      expect(isDegraded('app-a')).toBe(false);
      expect(isDegraded('app-b')).toBe(false);
    });

    it('重复标记同一应用幂等', () => {
      markDegraded('test-app');
      markDegraded('test-app');

      expect(isDegraded('test-app')).toBe(true);
    });
  });

  describe('三级降级决策', () => {
    it('首次失败（count=0）走静默自动重试', () => {
      expect(decideDegradationLevel('test-app')).toBe('auto-retry');
    });

    it('静默重试用尽后展示占位 UI', () => {
      // MAX_AUTO_RETRIES = 1，故 count=1 起进入 show-ui 区间
      setRetryCount('test-app', 1);

      expect(decideDegradationLevel('test-app')).toBe('show-ui');
    });

    it('达到用户可见重试上限后整页跳转', () => {
      setRetryCount('test-app', MAX_MICRO_RETRIES);

      expect(decideDegradationLevel('test-app')).toBe('full-page');
    });

    it('超过上限仍为整页跳转', () => {
      setRetryCount('test-app', MAX_MICRO_RETRIES + 10);

      expect(decideDegradationLevel('test-app')).toBe('full-page');
    });

    it('getRetryCount 对未记录的应用返回 0', () => {
      expect(getRetryCount('never-seen')).toBe(0);
    });

    it('resetRetryCount 清零后决策回到自动重试', () => {
      setRetryCount('test-app', MAX_MICRO_RETRIES);
      expect(decideDegradationLevel('test-app')).toBe('full-page');

      resetRetryCount('test-app');

      expect(decideDegradationLevel('test-app')).toBe('auto-retry');
    });
  });

  describe('自动重试退避延迟', () => {
    it('返回正数延迟', () => {
      const delay = getNextAutoRetryDelay('test-app');

      expect(delay).toBeGreaterThan(0);
    });

    it('延迟包含抖动，多次调用结果不完全一致', () => {
      const delays = new Set<number>();
      for (let i = 0; i < 20; i++) {
        delays.add(getNextAutoRetryDelay('test-app'));
      }

      // 抖动区间为 ±200ms，20 次采样应产生多个不同值
      expect(delays.size).toBeGreaterThan(1);
    });
  });

  describe('createErrorBoundaryManager', () => {
    it('dispose 同时清空降级集合与重试计数器', () => {
      markDegraded('test-app');
      setRetryCount('test-app', MAX_MICRO_RETRIES);

      const manager = createErrorBoundaryManager();
      manager.dispose();

      expect(isDegraded('test-app')).toBe(false);
      expect(getRetryCount('test-app')).toBe(0);
    });
  });
});
