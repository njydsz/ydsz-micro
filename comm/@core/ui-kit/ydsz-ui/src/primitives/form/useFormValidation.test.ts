/**
 * useFormValidation composable 测试 —— 防抖校验与分档触发时机。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\form\useFormValidation.test.ts
 * @author ydsz-team
 * @since 5.6.0
 */
import { describe, expect, it, vi } from 'vitest';

import { nextTick } from 'vue';

import { useFormValidation, type ValidateOnMode } from './useFormValidation';

describe('useFormValidation', () => {
  it('应返回防抖校验函数和立即校验函数', () => {
    const handle = useFormValidation();
    expect(typeof handle.debouncedValidate).toBe('function');
    expect(typeof handle.validateField).toBe('function');
    expect(handle.mode).toBeDefined();
  });

  it('默认校验模式应为 blur', () => {
    const handle = useFormValidation();
    expect(handle.mode.value).toBe('blur');
  });

  it('应支持所有校验触发模式', () => {
    const modes: ValidateOnMode[] = ['blur', 'change', 'input', 'submit'];
    const handle = useFormValidation();
    for (const mode of modes) {
      handle.mode.value = mode;
      expect(handle.mode.value).toBe(mode);
    }
  });

  it('validateField 在无 verify 函数时应视为通过（无错误）', async () => {
    const handle = useFormValidation();
    const result = await handle.validateField('anyField');
    // 无校验函数时，无错误产生，应返回 true（校验通过）
    expect(result).toBe(true);
  });

  it('有错误时 validateField 应返回 false', async () => {
    const mockValidate = vi.fn().mockResolvedValue({ email: '邮箱格式不正确' });
    const handle = useFormValidation(mockValidate);
    const result = await handle.validateField('email');
    expect(result).toBe(false);
  });

  it('无对应错误时 validateField 应返回 true', async () => {
    const mockValidate = vi.fn().mockResolvedValue({ otherField: '错误信息' });
    const handle = useFormValidation(mockValidate);
    const result = await handle.validateField('anyField');
    expect(result).toBe(true);
  });

  it('debouncedValidate 应延迟调用 verify 函数', async () => {
    const mockValidate = vi.fn().mockResolvedValue({});
    const handle = useFormValidation(mockValidate, { debounceMs: 50 });

    handle.debouncedValidate('field1');
    // 立即调用时 mockValidate 不应该被触发
    expect(mockValidate).not.toHaveBeenCalled();

    // 等待防抖周期
    await new Promise((resolve) => {
      setTimeout(resolve, 80);
    });
    await nextTick();
    expect(mockValidate).toHaveBeenCalled();
  });

  it('应支持自定义防抖延迟', () => {
    const handle = useFormValidation(undefined, { debounceMs: 1000 });
    expect(handle).toBeDefined();
  });
});
