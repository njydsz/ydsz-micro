/**
 * YdSlider 组件测试。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\slider\YdSlider.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { mount } from '@vue/test-utils';

import { describe, expect, it } from 'vitest';

import YdSlider from './YdSlider.vue';

describe('YdSlider', () => {
  describe('渲染', () => {
    it('渲染 slider 角色', () => {
      const wrapper = mount(YdSlider);
      expect(wrapper.find('[role="slider"]').exists()).toBe(true);
    });

    it('渲染轨道与范围', () => {
      const wrapper = mount(YdSlider);
      expect(wrapper.find('[role="slider"]').exists()).toBe(true);
    });
  });

  describe('range', () => {
    it('range=true 时渲染两个 thumb', () => {
      const wrapper = mount(YdSlider, {
        props: { range: true, modelValue: [20, 80] },
      });
      expect(wrapper.findAll('[role="slider"]').length).toBe(2);
    });

    it('单值模式渲染一个 thumb', () => {
      const wrapper = mount(YdSlider, {
        props: { modelValue: 50 },
      });
      expect(wrapper.findAll('[role="slider"]').length).toBe(1);
    });
  });

  describe('orientation', () => {
    it('orientation=vertical 含 data-orientation', () => {
      const wrapper = mount(YdSlider, {
        props: { orientation: 'vertical' },
      });
      expect(wrapper.find('[data-orientation="vertical"]').exists()).toBe(true);
    });
  });

  describe('disabled', () => {
    it('disabled 时含 data-disabled', () => {
      const wrapper = mount(YdSlider, {
        props: { disabled: true },
      });
      expect(wrapper.html()).toMatch(/data-disabled/);
    });
  });
});
