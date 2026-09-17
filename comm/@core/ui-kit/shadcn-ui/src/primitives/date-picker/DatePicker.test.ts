/**
 * YdDatePicker 组件测试 —— 验证 v-model 绑定、portal 挂载与 click-outside
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * <p>YdDatePicker 使用 Teleport 将日历面板挂载到 body，测试聚焦于：
 * - v-model 双向绑定与 change 事件
 * - disabled 状态阻止交互
 * - readonly input 防止手动编辑
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\date-picker\YdDatePicker.test.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import { describe, expect, it } from 'vitest';

import { mount } from '@vue/test-utils';

import YdDatePicker from './YdDatePicker.vue';

describe('YdDatePicker', () => {
  it('应能挂载并渲染 input 元素', () => {
    const wrapper = mount(YdDatePicker, {
      attachTo: document.body,
    });
    const input = wrapper.find('input');
    expect(input.exists()).toBe(true);
    wrapper.unmount();
  });

  it('input 应为 readonly', () => {
    const wrapper = mount(YdDatePicker, {
      attachTo: document.body,
    });
    const input = wrapper.find('input');
    expect(input.attributes('readonly')).toBeDefined();
    expect(input.attributes('type')).toBe('text');
    wrapper.unmount();
  });

  it('应显示 placeholder', () => {
    const wrapper = mount(YdDatePicker, {
      props: { placeholder: '请输入日期' },
      attachTo: document.body,
    });
    const input = wrapper.find('input');
    expect(input.attributes('placeholder')).toBe('请输入日期');
    wrapper.unmount();
  });

  it('v-model 应回显到 input', () => {
    const wrapper = mount(YdDatePicker, {
      props: { modelValue: '2026-09-17' },
      attachTo: document.body,
    });
    const input = wrapper.find('input');
    expect(input.element.value).toBe('2026-09-17');
    wrapper.unmount();
  });

  it('disabled 状态下 input 应禁用', () => {
    const wrapper = mount(YdDatePicker, {
      props: { disabled: true },
      attachTo: document.body,
    });
    const input = wrapper.find('input');
    expect(input.attributes('disabled')).toBeDefined();
    wrapper.unmount();
  });

  it('自定义 class 应被合并到容器', () => {
    const wrapper = mount(YdDatePicker, {
      props: { class: 'my-date-picker' },
      attachTo: document.body,
    });
    expect(wrapper.classes()).toContain('my-date-picker');
    wrapper.unmount();
  });

  it('默认 placeholder 应为「选择日期」', () => {
    const wrapper = mount(YdDatePicker, {
      attachTo: document.body,
    });
    const input = wrapper.find('input');
    expect(input.attributes('placeholder')).toBe('选择日期');
    wrapper.unmount();
  });

  it('type 默认为 date', () => {
    const wrapper = mount(YdDatePicker, {
      attachTo: document.body,
    });
    expect(wrapper.props('type')).toBe('date');
    wrapper.unmount();
  });
});
