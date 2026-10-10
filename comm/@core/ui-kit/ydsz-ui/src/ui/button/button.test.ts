/**
 * Button（button）组件单元测试。
 *
 * <p>覆盖核心路径：
 * <ul>
 *   <li>Props 传递验证（variant / size 类名是否正确附加）</li>
 *   <li>禁用态：是否阻止 click 事件</li>
 *   <li>Slot 内容是否渲染</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\button\button.test.ts
 * @author ydsz-team
 * @since 26.09.24
 */
import { describe, expect, it } from 'vitest';

import { mount } from '@vue/test-utils';

import Button from './button.vue';
import type { ButtonProps } from './button-types';

/**
 * 创建 Button 包裹器。
 *
 * @param props - props 覆盖
 * @param slots - 插槽内容
 * @returns mount 包裹器
 */
function createButton(props: ButtonProps = {}, slots?: { default?: string }) {
  return mount(Button, {
    props,
    slots: slots ?? { default: 'Click me' },
  });
}

describe('Button', () => {
  describe('Props 传递验证', () => {
    it('期望 primary variant 应附加 yd-button--primary 类名', () => {
      const wrapper = createButton({ variant: 'primary' });
      expect(wrapper.classes()).toContain('yd-button--primary');
      wrapper.unmount();
    });

    it('期望 secondary variant 应附加 yd-button--secondary 类名', () => {
      const wrapper = createButton({ variant: 'secondary' });
      expect(wrapper.classes()).toContain('yd-button--secondary');
      wrapper.unmount();
    });

    it('期望 ghost variant 应附加 yd-button--ghost 类名', () => {
      const wrapper = createButton({ variant: 'ghost' });
      expect(wrapper.classes()).toContain('yd-button--ghost');
      wrapper.unmount();
    });

    it('期望 destructive variant 应附加 yd-button--destructive 类名', () => {
      const wrapper = createButton({ variant: 'destructive' });
      expect(wrapper.classes()).toContain('yd-button--destructive');
      wrapper.unmount();
    });

    it('期望 sm 尺寸应附加 yd-button--sm 类名', () => {
      const wrapper = createButton({ size: 'sm' });
      expect(wrapper.classes()).toContain('yd-button--sm');
      wrapper.unmount();
    });

    it('期望 lg 尺寸应附加 yd-button--lg 类名', () => {
      const wrapper = createButton({ size: 'lg' });
      expect(wrapper.classes()).toContain('yd-button--lg');
      wrapper.unmount();
    });

    it('期望默认不传 variant / size 时应附加 yd-button--primary 与 yd-button--md', () => {
      const wrapper = createButton();
      expect(wrapper.classes()).toContain('yd-button--primary');
      expect(wrapper.classes()).toContain('yd-button--md');
      wrapper.unmount();
    });
  });

  describe('禁用态', () => {
    it('期望 disabled 为 true 时 button 元素应具有 disabled 属性', () => {
      const wrapper = createButton({ disabled: true });
      const button = wrapper.find('button');
      expect(button.attributes('disabled')).toBeDefined();
      wrapper.unmount();
    });

    it('期望 disabled 为 true 时应附加 yd-button--disabled 类名', () => {
      const wrapper = createButton({ disabled: true });
      expect(wrapper.classes()).toContain('yd-button--disabled');
      wrapper.unmount();
    });

    it('期望 disabled 为 true 时点击不应触发 confirm 事件', async () => {
      const wrapper = createButton({ disabled: true });
      await wrapper.trigger('click');
      expect(wrapper.emitted('confirm')).toBeFalsy();
      wrapper.unmount();
    });
  });

  describe('Slot 渲染', () => {
    it('期望默认插槽内容应渲染到 button 内部', () => {
      const wrapper = createButton({}, { default: '提交' });
      expect(wrapper.text()).toBe('提交');
      wrapper.unmount();
    });

    it('期望空插槽时应不显示任何文本', () => {
      const wrapper = createButton({}, { default: '' });
      expect(wrapper.text()).toBe('');
      wrapper.unmount();
    });
  });

  describe('事件', () => {
    it('期望点击按钮时应触发 confirm 事件', async () => {
      const wrapper = createButton({});
      await wrapper.trigger('click');
      expect(wrapper.emitted('confirm')).toBeTruthy();
      expect(wrapper.emitted('confirm')?.length).toBe(1);
      wrapper.unmount();
    });
  });

  describe('边界路径', () => {
    it('期望未传 props 时组件应正常渲染且基础类名 yd-button 存在', () => {
      const wrapper = createButton();
      expect(wrapper.classes()).toContain('yd-button');
      expect(wrapper.find('button').exists()).toBe(true);
      wrapper.unmount();
    });

    it('期望 disabled 为 false 时 button 元素不应具有 disabled 属性', () => {
      const wrapper = createButton({ disabled: false });
      const button = wrapper.find('button');
      expect(button.attributes('disabled')).toBeUndefined();
      wrapper.unmount();
    });
  });
});
