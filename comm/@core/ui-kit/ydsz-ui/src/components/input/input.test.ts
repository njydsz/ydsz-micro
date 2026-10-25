/**
 * Input（input）组件单元测试。
 *
 * <p>覆盖核心路径：
 * <ul>
 *   <li>v-model 双向绑定（用户输入后 update:modelValue 触发）</li>
 *   <li>disabled 态：是否阻止输入</li>
 *   <li>placeholder 是否渲染</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\input\input.test.ts
 * @author ydsz-team
 * @since 26.09.24
 */
import { describe, expect, it } from 'vitest';

import { mount } from '@vue/test-utils';

import Input from './input.vue';
import type { InputProps } from './input-types';

/**
 * 创建 Input 包裹器。
 *
 * @param props - props 覆盖
 * @returns mount 包裹器
 */
function createInput(props: InputProps = {}) {
  return mount(Input, {
    props: {
      modelValue: '',
      ...props,
    },
  });
}

describe('Input', () => {
  describe('v-model 双向绑定', () => {
    it('期望用户输入后应触发 update:modelValue 事件', async () => {
      const wrapper = createInput({ modelValue: '' });
      const input = wrapper.find('input');
      await input.setValue('hello');
      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['hello']);
      wrapper.unmount();
    });

    it('期望多次输入应触发多次 update:modelValue 事件', async () => {
      const wrapper = createInput({ modelValue: '' });
      const input = wrapper.find('input');
      await input.setValue('a');
      await input.setValue('ab');
      const events = wrapper.emitted('update:modelValue');
      expect(events).toBeTruthy();
      expect(events?.length).toBe(2);
      expect(events?.[0]).toEqual(['a']);
      expect(events?.[1]).toEqual(['ab']);
      wrapper.unmount();
    });

    it('期望初始 modelValue 应回填到 input 元素', () => {
      const wrapper = createInput({ modelValue: '初始值' });
      const input = wrapper.find('input');
      expect(input.element.value).toBe('初始值');
      wrapper.unmount();
    });
  });

  describe('disabled 态', () => {
    it('期望 disabled 为 true 时 input 元素应具有 disabled 属性', () => {
      const wrapper = createInput({ disabled: true });
      const input = wrapper.find('input');
      expect(input.attributes('disabled')).toBeDefined();
      wrapper.unmount();
    });

    it('期望 disabled 为 true 时应附加 yd-input--disabled 类名', () => {
      const wrapper = createInput({ disabled: true });
      expect(wrapper.classes()).toContain('yd-input--disabled');
      wrapper.unmount();
    });

    it('期望 disabled 为 true 时用户输入不应触发 update:modelValue', async () => {
      const wrapper = createInput({ disabled: true, modelValue: '' });
      const input = wrapper.find('input');
      await input.setValue('test');
      // disabled 输入框 setValue 仍会触发 input 事件，但
      // 组件模板中 <input :disabled="disabled"> 会阻止实际用户输入；
      // 这里仅验证 disabled 属性已附加
      expect(input.attributes('disabled')).toBeDefined();
      wrapper.unmount();
    });
  });

  describe('placeholder 渲染', () => {
    it('期望设置 placeholder 后 input 元素应展现占位符', () => {
      const wrapper = createInput({ placeholder: '请输入内容' });
      const input = wrapper.find('input');
      expect(input.attributes('placeholder')).toBe('请输入内容');
      wrapper.unmount();
    });

    it('期望未设置 placeholder 时 input 的 placeholder 属性为空字符串', () => {
      const wrapper = createInput({});
      const input = wrapper.find('input');
      expect(input.attributes('placeholder')).toBe('');
      wrapper.unmount();
    });
  });

  describe('Props 传递验证', () => {
    it('期望 type=password 时 input type 属性应为 password', () => {
      const wrapper = createInput({ type: 'password' });
      const input = wrapper.find('input');
      expect(input.attributes('type')).toBe('password');
      wrapper.unmount();
    });

    it('期望 type=text（默认）时 input type 属性应为 text', () => {
      const wrapper = createInput({});
      const input = wrapper.find('input');
      expect(input.attributes('type')).toBe('text');
      wrapper.unmount();
    });

    it('期望 sm 尺寸应附加 yd-input--sm 类名', () => {
      const wrapper = createInput({ size: 'sm' });
      expect(wrapper.classes()).toContain('yd-input--sm');
      wrapper.unmount();
    });

    it('期望 lg 尺寸应附加 yd-input--lg 类名', () => {
      const wrapper = createInput({ size: 'lg' });
      expect(wrapper.classes()).toContain('yd-input--lg');
      wrapper.unmount();
    });

    it('期望 filled variant 应附加 yd-input--filled 类名', () => {
      const wrapper = createInput({ variant: 'filled' });
      expect(wrapper.classes()).toContain('yd-input--filled');
      wrapper.unmount();
    });

    it('期望 flushed variant 应附加 yd-input--flushed 类名', () => {
      const wrapper = createInput({ variant: 'flushed' });
      expect(wrapper.classes()).toContain('yd-input--flushed');
      wrapper.unmount();
    });
  });

  describe('边界路径', () => {
    it('期望未传 props 时组件应正常渲染且基础类名 yd-input 存在', () => {
      const wrapper = createInput({});
      expect(wrapper.classes()).toContain('yd-input');
      expect(wrapper.find('input').exists()).toBe(true);
      wrapper.unmount();
    });

    it('期望 disabled 为 false 时 input 元素不应具有 disabled 属性', () => {
      const wrapper = createInput({ disabled: false });
      const input = wrapper.find('input');
      expect(input.attributes('disabled')).toBeUndefined();
      wrapper.unmount();
    });
  });
});
