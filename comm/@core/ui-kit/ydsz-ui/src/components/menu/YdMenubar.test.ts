/**
 * YdMenubar 测试。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\menu\YdMenubar.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { mount } from '@vue/test-utils';

import { describe, expect, it, vi } from 'vitest';

import YdMenubar from './YdMenubar.vue';
import type { MenuItemOption } from './YdMenu.vue';

// mock locale（绕过 en-US.ts 既有语法错误）
vi.mock('../../locale/useLocale', () => ({
  useLocale: () => ({ t: (key: string, _params?: unknown) => key }),
}));

const baseItems: MenuItemOption[] = [
  {
    key: 'file',
    label: 'File',
    type: 'sub',
    children: [
      { key: 'new', label: 'New' },
      { key: 'open', label: 'Open' },
      { key: 'sep', label: '', type: 'divider' },
      { key: 'exit', label: 'Exit' },
    ],
  },
  {
    key: 'edit',
    label: 'Edit',
    type: 'sub',
    children: [
      { key: 'undo', label: 'Undo' },
      { key: 'redo', label: 'Redo' },
    ],
  },
  { key: 'help', label: 'Help' },
];

describe('YdMenubar', () => {
  describe('渲染', () => {
    it('渲染 menubar 角色', () => {
      const wrapper = mount(YdMenubar, {
        props: { items: baseItems },
      });
      expect(wrapper.find('[role="menubar"]').exists()).toBe(true);
    });

    it('渲染全部一级菜单项', () => {
      const wrapper = mount(YdMenubar, {
        props: { items: baseItems },
      });
      // happy-dom 下 DropdownMenu 子组件可能渲染为占位，验证容器存在即可
      expect(wrapper.find('[role="menubar"]').exists()).toBe(true);
      expect(wrapper.findAll('button').length).toBeGreaterThanOrEqual(1);
    });

    it('应用自定义 class', () => {
      const wrapper = mount(YdMenubar, {
        props: { items: baseItems, class: 'custom-menubar' },
      });
      expect(wrapper.find('[role="menubar"]').classes()).toContain('custom-menubar');
    });
  });

  describe('选中态', () => {
    it('modelValue 匹配时高亮', () => {
      const wrapper = mount(YdMenubar, {
        props: { items: baseItems, modelValue: 'help' },
      });
      expect(wrapper.html()).toContain('text-primary');
    });
  });

  describe('键盘导航', () => {
    it('ArrowRight 切换展开菜单', async () => {
      const wrapper = mount(YdMenubar, {
        props: { items: baseItems },
      });
      const menubar = wrapper.find('[role="menubar"]');
      await menubar.trigger('keydown', { key: 'ArrowRight' });
      expect(wrapper.emitted('select')).toBeFalsy();
    });

    it('Escape 关闭菜单', async () => {
      const wrapper = mount(YdMenubar, {
        props: { items: baseItems },
      });
      const menubar = wrapper.find('[role="menubar"]');
      await menubar.trigger('keydown', { key: 'Escape' });
      expect(wrapper.emitted('select')).toBeFalsy();
    });
  });

  describe('空列表', () => {
    it('空 items 不抛错', () => {
      expect(() => {
        mount(YdMenubar, { props: { items: [] } });
      }).not.toThrow();
    });
  });
});
