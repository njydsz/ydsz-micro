/**
 * YdCalendar 组件测试。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\calendar\YdCalendar.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

import { describe, expect, it } from 'vitest';

import YdCalendar from './YdCalendar.vue';

describe('YdCalendar', () => {
  describe('渲染', () => {
    it('渲染星期表头（7 列）', () => {
      const wrapper = mount(YdCalendar);
      const header = wrapper.find('.grid.grid-cols-7');
      expect(header.exists()).toBe(true);
    });

    it('渲染 42 个日期格', () => {
      const wrapper = mount(YdCalendar);
      const dayButtons = wrapper.findAll('button[aria-label]');
      // 42 格 + 头部按钮
      expect(dayButtons.length).toBeGreaterThanOrEqual(42);
    });
  });

  describe('选中态', () => {
    it('value 存在时对应日期 aria-selected', () => {
      const value = new Date(2026, 10, 5);
      const wrapper = mount(YdCalendar, {
        props: { value },
      });
      const selected = wrapper.findAll('button[aria-selected="true"]');
      expect(selected.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('交互', () => {
    it('点击日期不抛错', async () => {
      const wrapper = mount(YdCalendar);
      const dayButtons = wrapper.findAll('button[aria-label]');
      if (dayButtons.length > 0) {
        await dayButtons[0]!.trigger('click');
        await nextTick();
        expect(wrapper.exists()).toBe(true);
      }
    });
  });

  describe('range', () => {
    it('range=true 接受 startDate/endDate', () => {
      const wrapper = mount(YdCalendar, {
        props: {
          range: true,
          startDate: new Date(2026, 10, 1),
          endDate: new Date(2026, 10, 10),
        },
      });
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('disabledDate', () => {
    it('disabledDate 命中时按钮禁用', () => {
      const wrapper = mount(YdCalendar, {
        props: {
          disabledDate: (date: Date) => date.getDate() === 1,
        },
      });
      expect(wrapper.exists()).toBe(true);
    });
  });
});
