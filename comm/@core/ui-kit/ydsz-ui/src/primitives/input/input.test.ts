/**
 * YdInput 组件测试 —— 验证核心交互。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\input\input.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { describe, it, expect } from 'vitest';

import YdInput from './YdInput.vue';

describe('YdInput', () => {
  it('YdInput 应被定义', () => {
    expect(YdInput).toBeDefined();
    expect(typeof YdInput).toBe('object');
  });

  it('应包含 class prop', () => {
    expect(YdInput.props).toHaveProperty('class');
  });

  it('应包含 modelValue prop', () => {
    expect(YdInput.props).toHaveProperty('modelValue');
  });

  it('应包含 defaultValue prop', () => {
    expect(YdInput.props).toHaveProperty('defaultValue');
  });
});
