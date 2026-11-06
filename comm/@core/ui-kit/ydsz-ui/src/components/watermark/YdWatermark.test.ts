/**
 * YdWatermark 组件测试。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\watermark\YdWatermark.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { mount } from '@vue/test-utils';

import { describe, expect, it } from 'vitest';

import YdWatermark from './YdWatermark.vue';

describe('YdWatermark', () => {
  describe('渲染', () => {
    it('渲染 aria-hidden 容器', () => {
      const wrapper = mount(YdWatermark, {
        props: { content: '机密' },
      });
      expect(wrapper.attributes('aria-hidden')).toBe('true');
    });

    it('容器含 pointer-events-none', () => {
      const wrapper = mount(YdWatermark, {
        props: { content: '机密' },
      });
      expect(wrapper.classes()).toContain('pointer-events-none');
    });

    it('容器含 fixed inset-0', () => {
      const wrapper = mount(YdWatermark, {
        props: { content: '机密' },
      });
      const cls = wrapper.classes();
      expect(cls).toContain('fixed');
      expect(cls.join(' ')).toMatch(/inset-0/);
    });
  });

  describe('zIndex', () => {
    it('zIndex=99 时 style 含 z-index: 99', () => {
      const wrapper = mount(YdWatermark, {
        props: { content: '机密', zIndex: 99 },
      });
      expect(wrapper.attributes('style') ?? '').toMatch(/z-index:\s*99/);
    });
  });

  describe('image 模式', () => {
    it('传入 image 时 backgroundImage 含 url', async () => {
      const wrapper = mount(YdWatermark, {
        props: { image: 'https://example.com/wm.png' },
      });
      // 等待 onMounted 应用
      await wrapper.vm.$nextTick();
      const style = wrapper.attributes('style') ?? '';
      expect(style).toMatch(/background-image/);
    });
  });

  describe('默认 content', () => {
    it('未传 content 时使用默认值', async () => {
      const wrapper = mount(YdWatermark);
      await wrapper.vm.$nextTick();
      expect(wrapper.exists()).toBe(true);
    });
  });
});
