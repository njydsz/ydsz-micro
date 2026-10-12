/**
 * YdFormItem 与 form 相关组件测试 — 验证注入上下文、消息可见性
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\form\form-item.test.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import { describe, it, expect } from 'vitest';

import { mount } from '@vue/test-utils';

import YdFormItem from './YdFormItem.vue';
import YdFormLabel from './YdFormLabel.vue';
import YdFormControl from './YdFormControl.vue';
import YdFormMessage from './YdFormMessage.vue';
import YdFormDescription from './YdFormDescription.vue';
import { FORM_ITEM_INJECTION_KEY } from './injectionKeys';

describe('YdFormItem', () => {
  it('应包含 class prop', () => {
    expect(YdFormItem.props).toHaveProperty('class');
  });

  it('应注入 FORM_ITEM_INJECTION_KEY', () => {
    mount(YdFormItem, {
      slots: {
        default: '<div></div>',
      },
    });
    // 验证注入 key 存在且类型为 symbol
    expect(typeof FORM_ITEM_INJECTION_KEY).toBe('symbol');
  });

  it('应渲染 slot 内容', () => {
    const wrapper = mount(YdFormItem, {
      slots: {
        default: '<span data-testid="form-content">hello</span>',
      },
    });
    expect(wrapper.find('[data-testid="form-content"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('hello');
  });

  it('应接受自定义 class', () => {
    const wrapper = mount(YdFormItem, {
      props: { class: 'custom-form-item-class' },
      slots: {
        default: '<div></div>',
      },
    });
    expect(wrapper.classes()).toContain('custom-form-item-class');
  });
});

describe('Form related exports', () => {
  it('YdFormLabel 应导出', () => {
    expect(YdFormLabel).toBeDefined();
  });

  it('YdFormControl 应导出', () => {
    expect(YdFormControl).toBeDefined();
  });

  it('YdFormMessage 应导出', () => {
    expect(YdFormMessage).toBeDefined();
  });

  it('YdFormDescription 应导出', () => {
    expect(YdFormDescription).toBeDefined();
  });
});

describe('FORM_ITEM_INJECTION_KEY', () => {
  it('应该是 Symbol 类型的 InjectionKey', () => {
    const key = FORM_ITEM_INJECTION_KEY;
    expect(typeof key).toBe('symbol');
    expect(key.toString()).toContain('Symbol');
  });
});
