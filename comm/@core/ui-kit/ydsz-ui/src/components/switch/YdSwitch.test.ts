/**
 * YdSwitch 组件测试。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\switch\YdSwitch.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { mount } from '@vue/test-utils';

import { describe, expect, it } from 'vitest';

import YdSwitch from './YdSwitch.vue';

describe('YdSwitch', () => {
  describe('渲染', () => {
    it('渲染 switch 角色', () => {
      const wrapper = mount(YdSwitch);
      const btn = wrapper.find('button');
      expect(btn.exists()).toBe(true);
      expect(btn.attributes('role')).toBe('switch');
    });

    it('默认未选中', () => {
      const wrapper = mount(YdSwitch);
      expect(wrapper.find('button').attributes('data-state')).toBe('unchecked');
    });

    it('modelValue=true 时选中（Radix 用 checked）', () => {
      const wrapper = mount(YdSwitch, {
        props: { checked: true },
      });
      expect(wrapper.find('button').attributes('data-state')).toBe('checked');
    });
  });

  describe('交互', () => {
    it('点击不抛错', async () => {
      const wrapper = mount(YdSwitch, {
        props: { checked: false },
      });
      await wrapper.find('button').trigger('click');
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('disabled', () => {
    it('disabled 时含 data-disabled', () => {
      const wrapper = mount(YdSwitch, {
        props: { disabled: true },
      });
      expect(wrapper.find('button').attributes('data-disabled')).toBeDefined();
    });
  });
});
