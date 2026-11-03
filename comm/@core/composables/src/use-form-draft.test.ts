/**
 * useFormDraft 组合式函数单元测试。
 *
 * <p>用例覆盖：
 * - draft ref 初始值为 undefined
 * - restoreDraft 从 localStorage 恢复有效草稿
 * - restoreDraft 遇到过期草稿返回 undefined 并自动清除
 * - restoreDraft 遇到损坏 JSON 返回 undefined 并清除
 * - hasDraft 正确反映草稿存在状态
 * - clearDraft 清除 localStorage 与 ref
 * - flushDraft 立即将当前 draft 写入 localStorage
 * - flushDraft 不写入 undefined 值
 * - localStorage 写入异常（quota exceeded）静默不抛
 *
 * @path comm\@core\composables\src\use-form-draft.test.ts
 * @author ydsz-team
 * @since 26.10.06
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useFormDraft } from './use-form-draft';

const DRAFT_PREFIX = 'ydsz:draft:';

/** 从 localStorage 中读取原始字符串（仅供测试验证） */
function readRaw(key: string): string | null {
  return localStorage.getItem(`${DRAFT_PREFIX}${key}`);
}

/** 直接向 localStorage 写入原始字符串（仅供测试准备） */
function writeRaw(key: string, value: string): void {
  localStorage.setItem(`${DRAFT_PREFIX}${key}`, value);
}

describe('useFormDraft', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
    vi.setSystemTime(new Date(2026, 0, 1, 0, 0, 0));
  });

  it('draft ref 初始值为 undefined', () => {
    const { draft } = useFormDraft<{ name: string }>({ key: 'init-test' });
    expect(draft.value).toBeUndefined();
  });

  it('restoreDraft 从 localStorage 恢复有效草稿', () => {
    const savedData = { name: '张三', age: 30 };
    writeRaw('restore-test', JSON.stringify({ savedAt: Date.now(), data: savedData }));

    const { draft, restoreDraft } = useFormDraft<{ name: string; age: number }>({
      key: 'restore-test',
    });
    const restored = restoreDraft();

    expect(restored).toEqual(savedData);
    expect(draft.value).toEqual(savedData);
  });

  it('restoreDraft 遇到过期草稿返回 undefined 并自动从 localStorage 清除', () => {
    // 写入 8 天前的草稿（默认 TTL 7 天）
    const expiredTime = Date.now() - 8 * 24 * 3600 * 1000;
    writeRaw('expired-test', JSON.stringify({ savedAt: expiredTime, data: 'old' }));

    const { draft, restoreDraft } = useFormDraft<string>({
      key: 'expired-test',
      ttlSeconds: 7 * 24 * 3600,
    });
    const restored = restoreDraft();

    expect(restored).toBeUndefined();
    expect(draft.value).toBeUndefined();
    expect(readRaw('expired-test')).toBeNull();
  });

  it('restoreDraft 遇到损坏 JSON 返回 undefined 并清除', () => {
    writeRaw('corrupt-test', 'not valid json{{{');

    const { restoreDraft } = useFormDraft<unknown>({ key: 'corrupt-test' });
    const restored = restoreDraft();

    expect(restored).toBeUndefined();
    expect(readRaw('corrupt-test')).toBeNull();
  });

  it('restoreDraft 遇到结构缺失 savedAt 字段返回 undefined', () => {
    writeRaw('no-savedat-test', JSON.stringify({ data: 'something' }));

    const { restoreDraft } = useFormDraft<unknown>({ key: 'no-savedat-test' });
    const restored = restoreDraft();

    expect(restored).toBeUndefined();
  });

  it('hasDraft 无草稿时返回 false，有有效草稿时返回 true', () => {
    const { hasDraft } = useFormDraft<string>({ key: 'has-draft-test' });
    expect(hasDraft()).toBe(false);

    writeRaw('has-draft-test', JSON.stringify({ savedAt: Date.now(), data: 'hello' }));
    expect(hasDraft()).toBe(true);
  });

  it('clearDraft 清除 localStorage 与 ref', () => {
    writeRaw('clear-test', JSON.stringify({ savedAt: Date.now(), data: 'to-be-cleared' }));

    const { draft, restoreDraft, clearDraft } = useFormDraft<string>({ key: 'clear-test' });
    restoreDraft();
    expect(draft.value).toBe('to-be-cleared');

    clearDraft();
    expect(readRaw('clear-test')).toBeNull();
    expect(draft.value).toBeUndefined();
  });

  it('flushDraft 立即将当前 draft 值写入 localStorage', () => {
    const { draft, flushDraft } = useFormDraft<{ field: string }>({ key: 'flush-test' });
    draft.value = { field: 'value' };

    flushDraft();

    const raw = readRaw('flush-test');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw as string);
    expect(parsed.data).toEqual({ field: 'value' });
    expect(typeof parsed.savedAt).toBe('number');
  });

  it('flushDraft 在 draft 为 undefined 时不写入 localStorage', () => {
    const { flushDraft } = useFormDraft<unknown>({ key: 'flush-undefined-test' });

    flushDraft();
    expect(readRaw('flush-undefined-test')).toBeNull();
  });

  it('localStorage.setItem 抛异常时静默不抛出', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    const { draft, flushDraft } = useFormDraft<string>({ key: 'quota-test' });
    draft.value = 'test-value';

    expect(() => flushDraft()).not.toThrow();
    spy.mockRestore();
  });
});
