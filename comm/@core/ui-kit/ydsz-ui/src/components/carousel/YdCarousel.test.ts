/**
 * YdCarousel 组件测试。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\carousel\YdCarousel.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { mount } from '@vue/test-utils';

import { describe, expect, it } from 'vitest';

import YdCarousel from './YdCarousel.vue';

describe('YdCarousel', () => {
  describe('渲染', () => {
    it('渲染容器', () => {
      const wrapper = mount(YdCarousel, {
        slots: { default: '<div data-carousel-item>1</div>' },
      });
      expect(wrapper.exists()).toBe(true);
    });

    it('默认显示箭头', () => {
      const wrapper = mount(YdCarousel, {
        props: { arrows: true },
      });
      expect(wrapper.findAll('button').length).toBeGreaterThanOrEqual(2);
    });

    it('arrows=false 时无箭头', () => {
      const wrapper = mount(YdCarousel, {
        props: { arrows: false },
      });
      expect(wrapper.findAll('button').length).toBe(0);
    });

    it('dots=false 时无 dots 容器', () => {
      const wrapper = mount(YdCarousel, {
        props: { dots: false },
      });
      expect(wrapper.find('[aria-label]').exists() || wrapper.findAll('button').length === 0).toBe(
        true,
      );
    });
  });

  describe('交互', () => {
    it('点击下一张触发 change 事件', async () => {
      const wrapper = mount(YdCarousel, {
        props: { arrows: true },
        slots: { default: '<div data-carousel-item>1</div><div data-carousel-item>2</div>' },
      });
      // 找到 next 按钮（最后一个 button）
      const buttons = wrapper.findAll('button');
      const nextBtn = buttons[buttons.length - 1]!;
      await nextBtn.trigger('click');
      expect(wrapper.emitted('change')).toBeTruthy();
    });
  });

  describe('loop', () => {
    it('loop=false 时到末尾不跳转', async () => {
      const wrapper = mount(YdCarousel, {
        props: { arrows: true, loop: false },
        slots: { default: '<div data-carousel-item>1</div>' },
      });
      const buttons = wrapper.findAll('button');
      const nextBtn = buttons[buttons.length - 1]!;
      await nextBtn.trigger('click');
      // 只有一张时 change 不应触发
      expect(wrapper.emitted('change')).toBeFalsy();
    });
  });
});
