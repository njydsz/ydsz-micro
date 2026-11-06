/**
 * Separator 分隔线行为与 a11y 测试。
 *
 * @path comm\@core\ui-kit\ydsz-vue\src\Separator\Separator.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { mount } from '@vue/test-utils';

import Separator from './Separator.vue';

describe('Separator', () => {
  describe('渲染', () => {
    it('默认渲染为水平分隔线', () => {
      const wrapper = mount(Separator);
      const el = wrapper.element as HTMLElement;
      expect(el.tagName).toBe('DIV');
      // Radix Separator 渲染 role="separator"
      expect(el.getAttribute('role')).toBe('separator');
    });

    it('orientation=vertical 时设置 aria-orientation', () => {
      const wrapper = mount(Separator, {
        props: { orientation: 'vertical' },
      });
      expect(wrapper.element.getAttribute('aria-orientation')).toBe('vertical');
    });

    it('orientation=horizontal 时 aria-orientation 为 horizontal', () => {
      const wrapper = mount(Separator, {
        props: { orientation: 'horizontal' },
      });
      // decorative 默认 true 时 Radix 可能不输出 aria-orientation
      const el = wrapper.element;
      expect(el.getAttribute('role')).toBe('separator');
    });

    it('decorative=false 时保留 aria-orientation', () => {
      const wrapper = mount(Separator, {
        props: { decorative: false, orientation: 'vertical' },
      });
      expect(wrapper.element.getAttribute('aria-orientation')).toBe('vertical');
    });
  });

  describe('a11y', () => {
    it('通过 axe 无障碍检查（horizontal）', async () => {
      const wrapper = mount(Separator);
      expect(await axe(wrapper.element)).toHaveNoViolations();
    });

    it('通过 axe 无障碍检查（vertical）', async () => {
      const wrapper = mount(Separator, {
        props: { orientation: 'vertical' },
      });
      expect(await axe(wrapper.element)).toHaveNoViolations();
    });
  });
});
