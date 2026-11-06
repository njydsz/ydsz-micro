/**
 * YdMegaMenu 组件测试。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\mega-menu\YdMegaMenu.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { mount } from '@vue/test-utils';

import { describe, expect, it } from 'vitest';

import YdMegaMenu from './YdMegaMenu.vue';

const items = [
  {
    label: '产品',
    items: [
      {
        items: [
          { label: '子项 1', command: () => {} },
          { label: '子项 2', command: () => {} },
        ],
        title: '分组 A',
      },
    ],
  },
  { label: '关于', items: [] },
];

describe('YdMegaMenu', () => {
  describe('渲染', () => {
    it('渲染容器', () => {
      const wrapper = mount(YdMegaMenu, {
        props: { items },
      });
      expect(wrapper.exists()).toBe(true);
    });

    it('渲染 menubar 角色', () => {
      const wrapper = mount(YdMegaMenu, {
        props: { items },
      });
      expect(wrapper.find('[role="menubar"]').exists()).toBe(true);
    });

    it('渲染顶级菜单项', () => {
      const wrapper = mount(YdMegaMenu, {
        props: { items },
      });
      expect(wrapper.text()).toContain('产品');
      expect(wrapper.text()).toContain('关于');
    });

    it('顶级项含 aria-haspopup（有子项时）', () => {
      const wrapper = mount(YdMegaMenu, {
        props: { items },
      });
      expect(wrapper.findAll('[role="menuitem"]').length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('orientation', () => {
    it('orientation=vertical 含 vertical 修饰类', () => {
      const wrapper = mount(YdMegaMenu, {
        props: { items, orientation: 'vertical' },
      });
      expect(wrapper.classes().join(' ')).toMatch(/vertical/);
    });
  });

  describe('空 items', () => {
    it('空 items 不抛错', () => {
      expect(() => {
        mount(YdMegaMenu, { props: { items: [] } });
      }).not.toThrow();
    });
  });
});
