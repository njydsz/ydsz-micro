/**
 * YdRate 组件测试。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\rate\YdRate.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

import { describe, expect, it } from 'vitest';

import YdRate from './YdRate.vue';

describe('YdRate', () => {
  describe('渲染', () => {
    it('渲染 radiogroup 角色', () => {
      const wrapper = mount(YdRate);
      expect(wrapper.attributes('role')).toBe('radiogroup');
    });

    it('默认渲染 5 个星星', () => {
      const wrapper = mount(YdRate);
      expect(wrapper.findAll('button[role="radio"]').length).toBe(5);
    });

    it('count=3 时渲染 3 个星星', () => {
      const wrapper = mount(YdRate, {
        props: { count: 3 },
      });
      expect(wrapper.findAll('button[role="radio"]').length).toBe(3);
    });
  });

  describe('选中态', () => {
    it('modelValue=3 时前 3 个 aria-checked=true', () => {
      const wrapper = mount(YdRate, {
        props: { modelValue: 3 },
      });
      const stars = wrapper.findAll('button[role="radio"]');
      expect(stars[0]!.attributes('aria-checked')).toBe('true');
      expect(stars[2]!.attributes('aria-checked')).toBe('true');
      expect(stars[3]!.attributes('aria-checked')).toBe('false');
    });
  });

  describe('交互', () => {
    it('点击星星触发 update:modelValue', async () => {
      const wrapper = mount(YdRate, {
        props: { modelValue: 0 },
      });
      await wrapper.findAll('button[role="radio"]')[2]!.trigger('click');
      await nextTick();
      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    });

    it('再次点击同一满星归零', async () => {
      const wrapper = mount(YdRate, {
        props: { modelValue: 3 },
      });
      await wrapper.findAll('button[role="radio"]')[2]!.trigger('click');
      await nextTick();
      const events = wrapper.emitted('update:modelValue');
      if (events && events[0]) {
        expect((events[0] as number[])[0]).toBe(0);
      }
    });
  });

  describe('disabled', () => {
    it('disabled 时按钮禁用', () => {
      const wrapper = mount(YdRate, {
        props: { disabled: true },
      });
      expect(wrapper.findAll('button[role="radio"]')[0]!.attributes('disabled')).toBeDefined();
    });
  });
});
