/**
 * YdTreeSelect 组件测试 —— 属性验证。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\tree-select\tree-select.test.ts
 * @author ydsz-team
 * @since 5.6.0
 */

import { describe, expect, it } from 'vitest';

import YdTreeSelect from './YdTreeSelect.vue';

describe('YdTreeSelect', () => {
  it('应定义所有预期属性', () => {
    expect(YdTreeSelect).toBeDefined();
    const props = YdTreeSelect.props;
    expect(props).toHaveProperty('options');
    expect(props).toHaveProperty('modelValue');
    expect(props).toHaveProperty('placeholder');
    expect(props).toHaveProperty('disabled');
    expect(props).toHaveProperty('showSearch');
    expect(props).toHaveProperty('treeCheckable');
    expect(props).toHaveProperty('multiple');
  });
});
