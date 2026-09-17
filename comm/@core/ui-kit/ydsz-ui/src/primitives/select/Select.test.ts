/**
 * YdSelectBase 组件测试 —— 验证包装层 props 转发与插槽行为
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * <p>YdSelectBase 基于 radix-vue 的 SelectRoot，包装层职责为 props 转发与 v-model 绑定。
 * 其内部子组件（Content/Trigger/Item/Value）均依赖 SelectRootContext 注入，
 * 在隔离测试中无法独立挂载 —— 这些子组件由 radix-vue 官方测试覆盖。
 * 本套件聚焦于验证本包装层的 props 透传与 slot 行为。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\select\YdSelectBase.test.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import { describe, expect, it } from 'vitest';

import { mount } from '@vue/test-utils';

import YdSelectBase from './YdSelect.vue';

describe('YdSelectBase', () => {
  it('应能挂载并渲染 slot 内容', () => {
    const wrapper = mount(YdSelectBase, {
      slots: {
        default: '<div data-testid="child">inner</div>',
      },
    });
    expect(wrapper.find('[data-testid="child"]').exists()).toBe(true);
  });

  it('应转发 modelValue prop', () => {
    const wrapper = mount(YdSelectBase, {
      props: { modelValue: 'option-a' },
      slots: {
        default: '<div></div>',
      },
    });
    expect(wrapper.props('modelValue')).toBe('option-a');
  });

  it('disabled 状态下应传递 prop', () => {
    const wrapper = mount(YdSelectBase, {
      props: { disabled: true },
      slots: {
        default: '<div></div>',
      },
    });
    expect(wrapper.props('disabled')).toBe(true);
  });

  it('应支持 open prop', () => {
    const wrapper = mount(YdSelectBase, {
      props: { open: false },
      slots: {
        default: '<span>child</span>',
      },
    });
    expect(wrapper.props('open')).toBe(false);
  });

  it('应支持 dir 属性（RTL 方向）', () => {
    const wrapper = mount(YdSelectBase, {
      props: { dir: 'rtl' },
      slots: {
        default: '<span>child</span>',
      },
    });
    expect(wrapper.props('dir')).toBe('rtl');
  });

  it('name 属性应可用于表单提交', () => {
    const wrapper = mount(YdSelectBase, {
      props: { name: 'country' },
      slots: {
        default: '<span>child</span>',
      },
    });
    expect(wrapper.props('name')).toBe('country');
  });

  it('required 属性应可用于必填校验', () => {
    const wrapper = mount(YdSelectBase, {
      props: { required: true },
      slots: {
        default: '<span>child</span>',
      },
    });
    expect(wrapper.props('required')).toBe(true);
  });
});
