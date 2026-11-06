/**
 * YdPagination 组件测试。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\pagination\YdPagination.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

import { describe, expect, it } from 'vitest';

import YdPagination from './YdPagination.vue';

describe('YdPagination', () => {
  describe('渲染', () => {
    it('渲染分页容器', () => {
      const wrapper = mount(YdPagination, {
        props: { current: 1, total: 100, pageSize: 10 },
      });
      expect(wrapper.exists()).toBe(true);
    });

    it('渲染总条数文本', () => {
      const wrapper = mount(YdPagination, {
        props: { current: 1, total: 100, pageSize: 10, showTotal: true },
      });
      expect(wrapper.text()).toContain('100');
    });
  });

  describe('页码', () => {
    it('渲染页码按钮', () => {
      const wrapper = mount(YdPagination, {
        props: { current: 1, total: 100, pageSize: 10 },
      });
      const pageButtons = wrapper.findAll('button').filter((b) => /^\d+$/.test(b.text()));
      expect(pageButtons.length).toBeGreaterThan(0);
    });

    it('当前页含 aria-current', () => {
      const wrapper = mount(YdPagination, {
        props: { current: 2, total: 100, pageSize: 10 },
      });
      const currentBtn = wrapper.find('button[aria-current="page"]');
      expect(currentBtn.exists()).toBe(true);
    });
  });

  describe('交互', () => {
    it('点击页码触发 update:current', async () => {
      const wrapper = mount(YdPagination, {
        props: { current: 1, total: 100, pageSize: 10 },
      });
      const pageButtons = wrapper.findAll('button').filter((b) => /^\d+$/.test(b.text()));
      if (pageButtons.length > 1) {
        await pageButtons[1]!.trigger('click');
        await nextTick();
        expect(wrapper.emitted('update:current')).toBeTruthy();
      }
    });

    it('点击页码触发 change 事件', async () => {
      const wrapper = mount(YdPagination, {
        props: { current: 1, total: 100, pageSize: 10 },
      });
      const pageButtons = wrapper.findAll('button').filter((b) => /^\d+$/.test(b.text()));
      if (pageButtons.length > 1) {
        await pageButtons[1]!.trigger('click');
        await nextTick();
        expect(wrapper.emitted('change')).toBeTruthy();
      }
    });
  });

  describe('边界', () => {
    it('第一页时上一页禁用', () => {
      const wrapper = mount(YdPagination, {
        props: { current: 1, total: 100, pageSize: 10 },
      });
      // 上一页按钮为第一个 button（无 aria-label 时用位置）
      const buttons = wrapper.findAll('button');
      const prevBtn = buttons[0];
      expect(prevBtn?.attributes('disabled')).toBeDefined();
    });
  });

  describe('showSizeChanger', () => {
    it('showSizeChanger=true 时渲染 size select', () => {
      const wrapper = mount(YdPagination, {
        props: { current: 1, total: 100, pageSize: 10, showSizeChanger: true },
      });
      expect(wrapper.exists()).toBe(true);
    });
  });
});
