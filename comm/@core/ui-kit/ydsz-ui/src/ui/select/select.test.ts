/**
 * Select（select）组件单元测试。
 *
 * <p>覆盖核心路径：
 * <ul>
 *   <li>options（placeholder）渲染</li>
 *   <li>选择后事件触发</li>
 *   <li>disabled 态</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\select\select.test.ts
 * @author ydsz-team
 * @since 26.09.24
 */
import { describe, expect, it } from 'vitest';

import { mount } from '@vue/test-utils';

import Select from './select.vue';
import type { SelectProps } from './select-types';

/**
 * 创建 Select 包裹器。
 *
 * @param props - props 覆盖
 * @returns mount 包裹器
 */
function createSelect(props: SelectProps = {}) {
  return mount(Select, {
    props,
  });
}

describe('Select', () => {
  describe('options / placeholder 渲染', () => {
    it('期望默认 placeholder 文本应为"请选择"', () => {
      const wrapper = createSelect({});
      const firstOption = wrapper.find('option');
      expect(firstOption.text()).toBe('请选择');
      wrapper.unmount();
    });

    it('期望自定义 placeholder 应显示在首个 option 中', () => {
      const wrapper = createSelect({ placeholder: '选择城市' });
      const firstOption = wrapper.find('option');
      expect(firstOption.text()).toBe('选择城市');
      wrapper.unmount();
    });

    it('期望占位 option 应具有 disabled 属性', () => {
      const wrapper = createSelect({});
      const firstOption = wrapper.find('option');
      expect(firstOption.attributes('disabled')).toBeDefined();
      wrapper.unmount();
    });
  });

  describe('选择后事件', () => {
    it('期望 select 元素 change 时应触发 confirm 事件', async () => {
      const wrapper = createSelect({});
      const select = wrapper.find('select');
      // 设置一个非空的 value 然后触发 change
      await select.setValue('some-value');
      await select.trigger('change');
      expect(wrapper.emitted('confirm')).toBeTruthy();
      wrapper.unmount();
    });
  });

  describe('disabled 态', () => {
    it('期望 disabled 为 true 时 select 元素应具有 disabled 属性', () => {
      const wrapper = createSelect({ disabled: true });
      const select = wrapper.find('select');
      expect(select.attributes('disabled')).toBeDefined();
      wrapper.unmount();
    });

    it('期望 disabled 为 true 时应附加 yd-select--disabled 类名', () => {
      const wrapper = createSelect({ disabled: true });
      expect(wrapper.classes()).toContain('yd-select--disabled');
      wrapper.unmount();
    });

    it('期望 disabled 为 true 时 change 不应触发 confirm 事件', async () => {
      const wrapper = createSelect({ disabled: true });
      const select = wrapper.find('select');
      await select.trigger('change');
      // native select[disabled] 不会触发 change 事件，emit 应为 undefined
      expect(wrapper.emitted('confirm')).toBeFalsy();
      wrapper.unmount();
    });
  });

  describe('Props 传递验证', () => {
    it('期望 sm 尺寸应附加 yd-select--sm 类名', () => {
      const wrapper = createSelect({ size: 'sm' });
      expect(wrapper.classes()).toContain('yd-select--sm');
      wrapper.unmount();
    });

    it('期望 lg 尺寸应附加 yd-select--lg 类名', () => {
      const wrapper = createSelect({ size: 'lg' });
      expect(wrapper.classes()).toContain('yd-select--lg');
      wrapper.unmount();
    });

    it('期望 filled variant 应附加 yd-select--filled 类名', () => {
      const wrapper = createSelect({ variant: 'filled' });
      expect(wrapper.classes()).toContain('yd-select--filled');
      wrapper.unmount();
    });
  });

  describe('边界路径', () => {
    it('期望未传 props 时组件应正常渲染且基础类名 yd-select 存在', () => {
      const wrapper = createSelect({});
      expect(wrapper.classes()).toContain('yd-select');
      expect(wrapper.find('select').exists()).toBe(true);
      wrapper.unmount();
    });

    it('期望 disabled 为 false 时 select 元素不应具有 disabled 属性', () => {
      const wrapper = createSelect({ disabled: false });
      const select = wrapper.find('select');
      expect(select.attributes('disabled')).toBeUndefined();
      wrapper.unmount();
    });
  });
});
