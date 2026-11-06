/**
 * YdAvatar 组件测试。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\avatar\YdAvatar.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { mount } from '@vue/test-utils';

import { describe, expect, it } from 'vitest';

import YdAvatar from './YdAvatar.vue';
import YdAvatarFallback from './YdAvatarFallback.vue';
import YdAvatarImage from './YdAvatarImage.vue';

describe('YdAvatar', () => {
  describe('渲染', () => {
    it('默认渲染圆形容器', () => {
      const wrapper = mount(YdAvatar, {
        slots: { default: 'AB' },
      });
      const root = wrapper.element as HTMLElement;
      expect(root.classList.contains('rounded-full')).toBe(true);
    });

    it('shape=square 时圆角为 rounded-lg', () => {
      const wrapper = mount(YdAvatar, {
        props: { shape: 'square' },
        slots: { default: 'AB' },
      });
      expect(wrapper.classes()).toContain('rounded-lg');
    });

    it('size 映射到尺寸类', () => {
      const wrapper = mount(YdAvatar, {
        props: { size: 'lg' },
      });
      expect(wrapper.classes().join(' ')).toMatch(/h-12/);
    });

    it('应用自定义 class', () => {
      const wrapper = mount(YdAvatar, {
        props: { class: 'custom-avatar' },
      });
      expect(wrapper.classes()).toContain('custom-avatar');
    });
  });

  describe('YdAvatarImage', () => {
    it('在 Avatar 内渲染 img 且 object-cover', () => {
      const wrapper = mount(YdAvatar, {
        slots: {
          default: `
            <YdAvatarImage src="https://example.com/a.png" />
            <YdAvatarFallback>AB</YdAvatarFallback>
          `,
        },
        global: { components: { YdAvatarImage, YdAvatarFallback } },
      });
      const img = wrapper.find('img');
      expect(img.exists()).toBe(true);
      expect(img.classes()).toContain('object-cover');
    });
  });

  describe('YdAvatarFallback', () => {
    it('在 Avatar 内渲染默认 slot', () => {
      const wrapper = mount(YdAvatar, {
        slots: {
          default: `
            <YdAvatarImage src="" />
            <YdAvatarFallback>兜底</YdAvatarFallback>
          `,
        },
        global: { components: { YdAvatarImage, YdAvatarFallback } },
      });
      expect(wrapper.text()).toContain('兜底');
    });
  });
});
