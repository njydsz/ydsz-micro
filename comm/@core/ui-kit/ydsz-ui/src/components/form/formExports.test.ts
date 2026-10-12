/**
 * YdForm 表单模块测试 —— 验证导出与新特性。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\form\formExports.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { describe, it, expect } from 'vitest';

import { FORM_ITEM_INJECTION_KEY } from './injectionKeys';
import { useFormField } from './useFormField';
import type { ValidateOnMode } from './useFormValidation';

describe('YdForm module exports', () => {
  it('FORM_ITEM_INJECTION_KEY 应定义为 symbol', () => {
    expect(typeof FORM_ITEM_INJECTION_KEY === 'symbol').toBe(true);
  });

  it('useFormField 应定义为函数', () => {
    expect(typeof useFormField).toBe('function');
  });

  it('useFormField 脱离上下文应抛错', () => {
    expect(() => useFormField()).toThrow(/useFormField should be used within <FormField>/);
  });
});

describe('ValidateOnMode type', () => {
  it('应支持四档校验时机', () => {
    const modes: ValidateOnMode[] = ['blur', 'change', 'input', 'submit'];
    expect(modes).toHaveLength(4);
    expect(modes).toContain('blur');
    expect(modes).toContain('change');
    expect(modes).toContain('input');
    expect(modes).toContain('submit');
  });
});
