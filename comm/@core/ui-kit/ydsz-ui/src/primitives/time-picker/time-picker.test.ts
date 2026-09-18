/**
 * YdTimePicker 组件测试 —— 属性验证。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\time-picker\time-picker.test.ts
 * @author ydsz-team
 * @since 5.6.0
 */

import { describe, expect, it } from 'vitest';

import YdTimePicker from './YdTimePicker.vue';

describe('YdTimePicker', () => {
  it('应定义所有预期属性', () => {
    expect(YdTimePicker).toBeDefined();
    const props = YdTimePicker.props;
    expect(props).toHaveProperty('value');
    expect(props).toHaveProperty('placeholder');
    expect(props).toHaveProperty('use12Hours');
    expect(props).toHaveProperty('disabled');
    expect(props).toHaveProperty('allowClear');
    expect(props).toHaveProperty('size');
    expect(props).toHaveProperty('hourStep');
    expect(props).toHaveProperty('minuteStep');
    expect(props).toHaveProperty('secondStep');
  });
});
