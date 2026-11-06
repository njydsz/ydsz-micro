/**
 * YdBadge 组件测试。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\badge\YdBadge.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { mount } from '@vue/test-utils';

import { describe, expect, it } from 'vitest';

import YdBadge from './YdBadge.vue';

describe('YdBadge', () => {
  describe('渲染', () => {
    it('渲染默认 slot', () => {
      const wrapper = mount(YdBadge, {
        slots: { default: '99+' },
      });
      expect(wrapper.text()).toContain('99+');
    });

    it('默认 variant 使用 bg-accent', () => {
      const wrapper = mount(YdBadge, {
        slots: { default: '文本' },
      });
      expect(wrapper.classes()).toContain('bg-accent');
    });
  });

  describe('variant', () => {
    it('destructive 使用 text-destructive', () => {
      const wrapper = mount(YdBadge, {
        props: { variant: 'destructive' },
      });
      expect(wrapper.classes()).toContain('text-destructive');
    });

    it('primary 使用 bg-primary-subtle', () => {
      const wrapper = mount(YdBadge, {
        props: { variant: 'primary' },
      });
      expect(wrapper.classes().join(' ')).toMatch(/primary/);
    });

    it('outline 使用 border', () => {
      const wrapper = mount(YdBadge, {
        props: { variant: 'outline' },
      });
      expect(wrapper.classes().join(' ')).toMatch(/border/);
    });
  });

  describe('基础类名', () => {
    it('包含 inline-flex 与 rounded-md', () => {
      const wrapper = mount(YdBadge);
      const cls = wrapper.classes();
      expect(cls).toContain('inline-flex');
      expect(cls).toContain('rounded-md');
    });
  });
});
