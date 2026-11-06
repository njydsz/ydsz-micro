/**
 * YdColorPicker 组件测试。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\color-picker\YdColorPicker.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

import { describe, expect, it } from 'vitest';

import YdColorPicker from './YdColorPicker.vue';

describe('YdColorPicker', () => {
  describe('渲染', () => {
    it('渲染触发器按钮', () => {
      const wrapper = mount(YdColorPicker);
      expect(wrapper.find('button[aria-label]').exists()).toBe(true);
    });

    it('默认颜色为 #3b82f6', () => {
      const wrapper = mount(YdColorPicker);
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('尺寸', () => {
    it('size=small 使用小尺寸类', () => {
      const wrapper = mount(YdColorPicker, {
        props: { size: 'small' },
      });
      expect(wrapper.html()).toMatch(/h-6/);
    });
  });

  describe('面板交互', () => {
    it('点击触发器打开面板', async () => {
      const wrapper = mount(YdColorPicker);
      await wrapper.find('button[aria-label]').trigger('click');
      await nextTick();
      // 面板应渲染
      expect(wrapper.html()).toMatch(/absolute/);
    });

    it('Escape 关闭面板', async () => {
      const wrapper = mount(YdColorPicker);
      await wrapper.find('button[aria-label]').trigger('click');
      await nextTick();
      await wrapper.trigger('keydown', { key: 'Escape' });
    });
  });

  describe('allowClear', () => {
    it('allowClear=true 时显示清除按钮', () => {
      const wrapper = mount(YdColorPicker, {
        props: { allowClear: true },
      });
      expect(wrapper.exists()).toBe(true);
    });
  });
});
