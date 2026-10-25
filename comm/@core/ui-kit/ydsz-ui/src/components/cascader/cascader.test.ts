/**
 * YdCascader 组件测试 —— 级联选择器核心逻辑。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\cascader\cascader.test.ts
 * @author ydsz-team
 * @since 5.6.0
 */

import { describe, expect, it } from 'vitest';

import { mount } from '@vue/test-utils';

import YdCascader from './YdCascader.vue';
import type { CascaderOption } from './types';

const sampleOptions: CascaderOption[] = [
  {
    label: '福建',
    value: 'fj',
    children: [
      { label: '福州', value: 'fz' },
      { label: '厦门', value: 'xm' },
    ],
  },
  {
    label: '浙江',
    value: 'zj',
    children: [
      { label: '杭州', value: 'hz' },
      { label: '宁波', value: 'nb' },
    ],
  },
];

describe('YdCascader', () => {
  it('应定义 props', () => {
    expect(YdCascader).toBeDefined();
    expect(YdCascader.props).toHaveProperty('options');
    expect(YdCascader.props).toHaveProperty('modelValue');
    expect(YdCascader.props).toHaveProperty('placeholder');
  });

  it('应渲染触发器', () => {
    const wrapper = mount(YdCascader, {
      props: { options: sampleOptions },
    });
    const button = wrapper.find('button');
    expect(button.exists()).toBe(true);
    wrapper.unmount();
  });

  it('应显示 placeholder', () => {
    const wrapper = mount(YdCascader, {
      props: { options: sampleOptions, placeholder: '请选择城市' },
    });
    expect(wrapper.text()).toContain('请选择城市');
    wrapper.unmount();
  });

  it('点击应展开面板', async () => {
    const wrapper = mount(YdCascader, {
      props: { options: sampleOptions },
    });
    const button = wrapper.find('button');
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false);

    await button.trigger('click');
    expect(wrapper.find('[role="listbox"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it('显示已选值', () => {
    const wrapper = mount(YdCascader, {
      props: { options: sampleOptions, modelValue: ['fj', 'fz'] },
    });
    expect(wrapper.text()).toContain('fj / fz');
    wrapper.unmount();
  });

  it('disabled 应阻止展开', async () => {
    const wrapper = mount(YdCascader, {
      props: { options: sampleOptions, disabled: true },
    });
    const button = wrapper.find('button');
    await button.trigger('click');
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false);
    wrapper.unmount();
  });
});
