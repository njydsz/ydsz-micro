/**
 * YdEmpty 组件测试。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\empty\YdEmpty.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { mount } from '@vue/test-utils';

import { describe, expect, it } from 'vitest';

import YdEmpty from './YdEmpty.vue';

describe('YdEmpty', () => {
  describe('渲染', () => {
    it('默认渲染 status 角色', () => {
      const wrapper = mount(YdEmpty);
      expect(wrapper.attributes('role')).toBe('status');
    });

    it('默认显示图标', () => {
      const wrapper = mount(YdEmpty, {
        props: { showIcon: true },
      });
      expect(wrapper.html()).toMatch(/size-16/);
    });

    it('showIcon=false 时不显示图标', () => {
      const wrapper = mount(YdEmpty, {
        props: { showIcon: false },
      });
      expect(wrapper.html()).not.toMatch(/size-16/);
    });
  });

  describe('description', () => {
    it('传入 description 时显示', () => {
      const wrapper = mount(YdEmpty, {
        props: { description: '暂无数据' },
      });
      expect(wrapper.text()).toContain('暂无数据');
    });
  });

  describe('slots', () => {
    it('image slot 覆盖默认图标', () => {
      const wrapper = mount(YdEmpty, {
        slots: { image: '<span class="custom-image">自定义</span>' },
      });
      expect(wrapper.find('.custom-image').exists()).toBe(true);
    });

    it('默认 slot 渲染操作位', () => {
      const wrapper = mount(YdEmpty, {
        slots: { default: '<button>刷新</button>' },
      });
      expect(wrapper.text()).toContain('刷新');
    });
  });
});
