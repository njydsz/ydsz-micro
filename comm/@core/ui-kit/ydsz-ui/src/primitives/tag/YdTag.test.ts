/**
 * YdTag 组件单元测试。
 *
 * 用例覆盖：
 * - 默认渲染（文本 + class）
 * - closable 模式渲染关闭按钮
 * - close 事件触发
 * - variant / size 变体类名正确
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\tag\YdTag.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { mount } from '@vue/test-utils';

import { describe, expect, it } from 'vitest';

import YdTag from './YdTag.vue';

describe('YdTag', () => {
  it('renders default variant with text content', () => {
    const wrapper = mount(YdTag, {
      slots: { default: 'Test Tag' },
    });
    expect(wrapper.text()).toContain('Test Tag');
    expect(wrapper.classes()).toContain('rounded-full');
  });

  it('renders closable button when closable prop is true', () => {
    const wrapper = mount(YdTag, {
      props: { closable: true },
      slots: { default: 'Closable Tag' },
    });
    const button = wrapper.find('button');
    expect(button.exists()).toBe(true);
    expect(button.attributes('aria-label')).toContain('关闭标签');
  });

  it('emits close event when close button is clicked', async () => {
    const wrapper = mount(YdTag, {
      props: { closable: true },
      slots: { default: 'Closable' },
    });
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
    expect(wrapper.emitted('close')!.length).toBe(1);
  });

  it('does not render close button when closable is false', () => {
    const wrapper = mount(YdTag, {
      props: { closable: false },
      slots: { default: 'No Close' },
    });
    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('applies variant-specific classes', () => {
    const wrapper = mount(YdTag, {
      props: { variant: 'success' },
      slots: { default: 'Success' },
    });
    const classNames = wrapper.classes().join(' ');
    expect(classNames).toContain('success');
  });

  it('applies custom class via class prop', () => {
    const wrapper = mount(YdTag, {
      props: { class: 'custom-class' },
      slots: { default: 'Custom' },
    });
    expect(wrapper.classes()).toContain('custom-class');
  });
});
