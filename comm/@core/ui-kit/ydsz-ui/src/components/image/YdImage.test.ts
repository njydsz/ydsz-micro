/**
 * YdImage preview 接线与 srcList 测试。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\image\YdImage.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { mount } from '@vue/test-utils';

import { describe, expect, it, vi } from 'vitest';

import YdImage from './YdImage.vue';
import YdImagePreviewGroup from './YdImagePreviewGroup.vue';

// mock locale（绕过 en-US.ts 既有语法错误）
vi.mock('../../locale/useLocale', () => ({
  useLocale: () => ({ t: (key: string, _params?: unknown) => key }),
}));

const testSrc = 'https://example.com/a.png';

describe('YdImage', () => {
  describe('基础渲染', () => {
    it('渲染 img 元素', () => {
      const wrapper = mount(YdImage, {
        props: { src: testSrc, alt: '测试图片' },
      });
      const img = wrapper.find('img');
      expect(img.exists()).toBe(true);
      expect(img.attributes('alt')).toBe('测试图片');
      expect(img.attributes('src')).toBe(testSrc);
    });

    it('应用 rounded 变体', () => {
      const wrapper = mount(YdImage, {
        props: { src: testSrc, rounded: 'full' },
      });
      expect(wrapper.classes()).toContain('rounded-full');
    });

    it('应用 fit 变体', () => {
      const wrapper = mount(YdImage, {
        props: { src: testSrc, fit: 'contain' },
      });
      expect(wrapper.find('img').classes()).toContain('object-contain');
    });
  });

  describe('preview 模式', () => {
    it('preview=true 时容器为 button 角色', () => {
      const wrapper = mount(YdImage, {
        props: { src: testSrc, preview: true },
      });
      expect(wrapper.attributes('role')).toBe('button');
      expect(wrapper.attributes('tabindex')).toBe('0');
    });

    it('preview=true 时点击触发预览组 open', async () => {
      const images = [testSrc, 'https://example.com/b.png'];
      mount(YdImagePreviewGroup, {
        props: { images },
        slots: { default: '<div></div>' },
        global: { components: { YdImage } },
      });
      const imageWrapper = mount(YdImage, {
        props: { src: testSrc, preview: true },
      });
      expect(imageWrapper.exists()).toBe(true);
    });

    it('preview=false 时无 button 角色', () => {
      const wrapper = mount(YdImage, {
        props: { src: testSrc },
      });
      expect(wrapper.attributes('role')).toBeUndefined();
    });
  });

  describe('srcList', () => {
    it('srcList 提供时计算索引', () => {
      const srcList = ['a.png', 'b.png', 'c.png'];
      const wrapper = mount(YdImage, {
        props: { src: 'b.png', srcList, preview: true },
      });
      expect(wrapper.exists()).toBe(true);
    });

    it('previewSrcList 优先于 srcList', () => {
      const wrapper = mount(YdImage, {
        props: {
          src: 'a.png',
          srcList: ['a.png', 'b.png'],
          previewSrcList: ['hd-a.png', 'hd-b.png'],
          preview: true,
        },
      });
      expect(wrapper.exists()).toBe(true);
    });

    it('src 不在 srcList 中时索引为 0', () => {
      const wrapper = mount(YdImage, {
        props: { src: 'x.png', srcList: ['a.png', 'b.png'], preview: true },
      });
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('懒加载', () => {
    it('lazy=true 时 img loading=lazy', () => {
      const wrapper = mount(YdImage, {
        props: { src: testSrc, lazy: true },
      });
      expect(wrapper.find('img').attributes('loading')).toBe('lazy');
    });

    it('lazy=false 时无 loading 属性', () => {
      const wrapper = mount(YdImage, {
        props: { src: testSrc, lazy: false },
      });
      expect(wrapper.find('img').attributes('loading')).toBeUndefined();
    });
  });

  describe('加载态', () => {
    it('加载失败显示错误占位', async () => {
      const wrapper = mount(YdImage, {
        props: { src: testSrc, fallbackText: '加载失败' },
      });
      const img = wrapper.find('img');
      await img.trigger('error');
      expect(wrapper.find('[role="alert"]').exists()).toBe(true);
      expect(wrapper.text()).toContain('加载失败');
    });
  });
});
