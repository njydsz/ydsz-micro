/**
 * use-field-subscription 测试 — 验证字段级订阅隔离、多字段订阅与计算属性
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\form-ui\src\use-field-subscription.test.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import { describe, it, expect, vi } from 'vitest';

import { nextTick, reactive, ref } from 'vue';

import {
  watchField,
  watchMultipleFields,
  useFieldValue,
  useDependentFieldValues,
} from './use-field-subscription';

/** 构建类 vee-validate 表单 mock（仅含 values） */
function createMockForm(initial: Record<string, unknown> = {}) {
  return { values: reactive(initial) };
}

describe('watchField', () => {
  it('字段变化时应触发回调', async () => {
    const form = createMockForm({ name: '' });
    const callback = vi.fn();

    watchField(form, 'name', callback);
    form.values.name = 'yeshu';

    await nextTick();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('yeshu', '', expect.anything());
  });

  it('其他字段变更不应触发回调', async () => {
    const form = createMockForm({ name: '', status: 'idle' });
    const callback = vi.fn();

    watchField(form, 'name', callback);
    form.values.status = 'running';

    await nextTick();
    expect(callback).not.toHaveBeenCalled();
  });

  it('应支持嵌套路径', async () => {
    const form = createMockForm({ config: { theme: 'light' } });
    const callback = vi.fn();

    watchField(form, 'config.theme', callback);
    form.values.config.theme = 'dark';

    await nextTick();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('dark', 'light', expect.anything());
  });

  it('应返回 snapshot 与 stop 函数', () => {
    const form = createMockForm({ count: 42 });
    const result = watchField(form, 'count', vi.fn());

    expect(result.snapshot).toBe(42);
    expect(typeof result.stop).toBe('function');
  });

  it('调用 stop 后不再触发回调', async () => {
    const form = createMockForm({ val: 'a' });
    const callback = vi.fn();

    const { stop } = watchField(form, 'val', callback);
    stop();
    form.values.val = 'b';

    await nextTick();
    expect(callback).not.toHaveBeenCalled();
  });
});

describe('watchMultipleFields', () => {
  it('任一字段变化应触发回调', async () => {
    const form = createMockForm({ a: 1, b: 2, c: 3 });
    const callback = vi.fn();

    watchMultipleFields(form, ['a', 'b'], callback);
    form.values.a = 10;

    await nextTick();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('未订阅字段变更不应触发回调', async () => {
    const form = createMockForm({ a: 1, b: 2, c: 3 });
    const callback = vi.fn();

    watchMultipleFields(form, ['a', 'b'], callback);
    form.values.c = 99;

    await nextTick();
    expect(callback).not.toHaveBeenCalled();
  });
});

describe('useFieldValue', () => {
  it('value computed 应反映字段当前值', () => {
    const form = createMockForm({ status: 'draft' });
    const { value } = useFieldValue(form, 'status');

    expect(value.value).toBe('draft');
  });

  it('应使用 fallback 当值不存在', () => {
    const form = createMockForm({});
    const { value } = useFieldValue(form, 'missing', 'default-val');

    expect(value.value).toBe('default-val');
  });

  it('应接受 ref 包装的 form', () => {
    const form = createMockForm({ count: 5 });
    const formRef = ref(form);
    const { value } = useFieldValue(formRef, 'count');

    expect(value.value).toBe(5);
  });
});

describe('useDependentFieldValues', () => {
  it('应返回 Map 且 key 为 dependsOn 字段', () => {
    const form = createMockForm({ status: 'active', reason: '' });
    const map = useDependentFieldValues(form, [
      { source: 'reason', dependsOn: 'status' },
    ]);

    expect(map.has('status')).toBe(true);
    expect(map.get('status')?.value).toBe('active');
  });

  it('重复依赖字段只订阅一次', () => {
    const form = createMockForm({ status: 'x', type: 'y' });
    const map = useDependentFieldValues(form, [
      { source: 'a', dependsOn: 'status' },
      { source: 'b', dependsOn: 'status' },
    ]);

    // status 只有一个 Set 条目
    let count = 0;
    map.forEach((_, key) => { if (key === 'status') count++; });
    expect(count).toBe(1);
  });
});
