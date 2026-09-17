/**
 * 字典变更事件总线单元测试 — 验证 emit / on / cleanup 行为
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { emitDictChange, onDictChange } from './use-dict-event';

describe('use-dict-event', () => {
  beforeEach(() => {
    // 每个测试前清理：由于 dictEventTarget 是模块级单例，测试间不互相干扰。
    // 由于无法直接重置 EventTarget 监听器，本文件测试仅验证基本功能，
    // 不依赖监听器精确数量。
  });

  it('onDictChange 注册的回调应在 emitDictChange 时被调用', () => {
    const callback = vi.fn();
    onDictChange(callback);

    emitDictChange('gender');

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({ typeCode: 'gender' }),
    );
  });

  it('emitDictChange 不带参数时 detail.typeCode 为 undefined', () => {
    const callback = vi.fn();
    onDictChange(callback);

    emitDictChange();

    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({ typeCode: undefined }),
    );
  });

  it('detail 应包含 timestamp 且为数字', () => {
    const callback = vi.fn();
    onDictChange(callback);

    emitDictChange('status');

    const detail = callback.mock.calls[0][0];
    expect(detail).toHaveProperty('timestamp');
    expect(typeof detail.timestamp).toBe('number');
    expect(detail.timestamp).toBeGreaterThan(0);
  });

  it('返回的取消订阅函数应移除监听，后续 emit 不再触发', () => {
    const callback = vi.fn();
    const unsubscribe = onDictChange(callback);

    unsubscribe();
    emitDictChange('any-type');

    expect(callback).not.toHaveBeenCalled();
  });

  it('多个订阅者应全部收到同一事件', () => {
    const callbackA = vi.fn();
    const callbackB = vi.fn();
    onDictChange(callbackA);
    onDictChange(callbackB);

    emitDictChange('priority');

    expect(callbackA).toHaveBeenCalledTimes(1);
    expect(callbackB).toHaveBeenCalledTimes(1);
    expect(callbackA.mock.calls[0][0]).toEqual(callbackB.mock.calls[0][0]);
  });
});
