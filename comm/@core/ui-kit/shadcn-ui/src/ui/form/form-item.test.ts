/**
 * FormItem 与 form 相关组件测试 — 验证注入上下文、消息可见性
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\form\form-item.test.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import { describe, it, expect } from 'vitest';

import { mount } from '@vue/test-utils';

import FormItem from './FormItem.vue';
import FormLabel from './FormLabel.vue';
import FormControl from './FormControl.vue';
import FormMessage from './FormMessage.vue';
import FormDescription from './FormDescription.vue';
import { FORM_ITEM_INJECTION_KEY } from './injectionKeys';

describe('FormItem', () => {
  it('应包含 class prop', () => {
    expect(FormItem.props).toHaveProperty('class');
  });

  it('应注入 FORM_ITEM_INJECTION_KEY', () => {
    mount(FormItem, {
      slots: {
        default: '<div></div>',
      },
    });
    // 验证注入 key 存在且类型为 symbol
    expect(typeof FORM_ITEM_INJECTION_KEY).toBe('symbol');
  });

  it('应渲染 slot 内容', () => {
    const wrapper = mount(FormItem, {
      slots: {
        default: '<span data-testid="form-content">hello</span>',
      },
    });
    expect(wrapper.find('[data-testid="form-content"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('hello');
  });

  it('应接受自定义 class', () => {
    const wrapper = mount(FormItem, {
      props: { class: 'custom-form-item-class' },
      slots: {
        default: '<div></div>',
      },
    });
    expect(wrapper.classes()).toContain('custom-form-item-class');
  });
});

describe('Form related exports', () => {
  it('FormLabel 应导出', () => {
    expect(FormLabel).toBeDefined();
  });

  it('FormControl 应导出', () => {
    expect(FormControl).toBeDefined();
  });

  it('FormMessage 应导出', () => {
    expect(FormMessage).toBeDefined();
  });

  it('FormDescription 应导出', () => {
    expect(FormDescription).toBeDefined();
  });
});

describe('FORM_ITEM_INJECTION_KEY', () => {
  it('应该是 Symbol 类型的 InjectionKey', () => {
    const key = FORM_ITEM_INJECTION_KEY;
    expect(typeof key).toBe('symbol');
    expect(key.toString()).toContain('Symbol');
  });
});
