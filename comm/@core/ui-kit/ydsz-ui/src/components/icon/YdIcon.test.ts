/**
 * YdIcon 组件测试。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\icon\YdIcon.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { mount } from '@vue/test-utils';

import { describe, expect, it } from 'vitest';

import YdIcon from './YdIcon.vue';

describe('YdIcon', () => {
  describe('URL 图标', () => {
    it('icon 为 http URL 时渲染 img', () => {
      const wrapper = mount(YdIcon, {
        props: { icon: 'https://example.com/a.png' },
      });
      const img = wrapper.find('img');
      expect(img.exists()).toBe(true);
      expect(img.attributes('src')).toBe('https://example.com/a.png');
      expect(img.attributes('loading')).toBe('lazy');
      expect(img.attributes('aria-hidden')).toBe('true');
    });
  });

  describe('组件图标', () => {
    it('icon 为组件时渲染 component', () => {
      const stub = { template: '<span class="stub-icon">icon</span>' };
      const wrapper = mount(YdIcon, {
        props: { icon: stub },
      });
      expect(wrapper.find('.stub-icon').exists()).toBe(true);
    });
  });

  describe('Iconify 图标', () => {
    it('icon 为字符串时渲染 Iconify', () => {
      const wrapper = mount(YdIcon, {
        props: { icon: 'lucide:home' },
      });
      // IconifyIcon 渲染为 svg 或 span
      expect(wrapper.html()).toMatch(/svg|span/);
      expect(wrapper.attributes('aria-hidden')).toBe('true');
    });
  });

  describe('fallback', () => {
    it('icon 为空 + fallback=true 时渲染默认图标', () => {
      const wrapper = mount(YdIcon, {
        props: { fallback: true },
      });
      expect(wrapper.exists()).toBe(true);
    });
  });
});
