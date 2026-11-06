/**
 * Dashboard 组件测试（StatCard / MiniChart / DashboardGrid）。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\dashboard\Dashboard.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { mount } from '@vue/test-utils';

import { describe, expect, it } from 'vitest';

import YdDashboardGrid from './YdDashboardGrid.vue';
import YdMiniChart from './YdMiniChart.vue';
import YdStatCard from './YdStatCard.vue';

describe('Dashboard', () => {
  describe('YdStatCard', () => {
    it('渲染 title 与 value', () => {
      const wrapper = mount(YdStatCard, {
        props: { title: '总收入', value: 1000 },
      });
      expect(wrapper.text()).toContain('总收入');
      expect(wrapper.text()).toContain('1000');
    });

    it('prefix/suffix 拼接显示值', () => {
      const wrapper = mount(YdStatCard, {
        props: { title: '收入', value: 100, prefix: '¥', suffix: '元' },
      });
      expect(wrapper.text()).toContain('¥100元');
    });

    it('delta 正数显示 + 号', () => {
      const wrapper = mount(YdStatCard, {
        props: { title: '收入', value: 100, delta: 12.5 },
      });
      expect(wrapper.text()).toContain('+12.5%');
    });

    it('delta 负数显示 - 号', () => {
      const wrapper = mount(YdStatCard, {
        props: { title: '收入', value: 100, delta: -5 },
      });
      expect(wrapper.text()).toContain('-5.0%');
    });

    it('无 delta 时不渲染变化率区', () => {
      const wrapper = mount(YdStatCard, {
        props: { title: '收入', value: 100 },
      });
      expect(wrapper.text()).not.toContain('%');
    });
  });

  describe('YdMiniChart', () => {
    it('空数据时不渲染 path', () => {
      const wrapper = mount(YdMiniChart, {
        props: { data: [] },
      });
      expect(wrapper.find('path').exists()).toBe(false);
    });

    it('有数据时渲染 path', () => {
      const wrapper = mount(YdMiniChart, {
        props: { data: [1, 2, 3] },
      });
      expect(wrapper.find('path').exists()).toBe(true);
    });

    it('filled=false 时只渲染一条 path', () => {
      const wrapper = mount(YdMiniChart, {
        props: { data: [1, 2, 3], filled: false },
      });
      expect(wrapper.findAll('path').length).toBe(1);
    });

    it('filled=true 时渲染两条 path', () => {
      const wrapper = mount(YdMiniChart, {
        props: { data: [1, 2, 3], filled: true },
      });
      expect(wrapper.findAll('path').length).toBe(2);
    });

    it('svg 含 aria-hidden', () => {
      const wrapper = mount(YdMiniChart, {
        props: { data: [1, 2] },
      });
      expect(wrapper.find('svg').attributes('aria-hidden')).toBe('true');
    });
  });

  describe('YdDashboardGrid', () => {
    it('默认渲染网格', () => {
      const wrapper = mount(YdDashboardGrid, {
        slots: { default: '<div>卡片</div>' },
      });
      expect(wrapper.text()).toContain('卡片');
    });

    it('columns=2 含 grid-cols-2', () => {
      const wrapper = mount(YdDashboardGrid, {
        props: { columns: 2 },
      });
      expect(wrapper.html()).toMatch(/grid-cols-2/);
    });

    it('empty=true 时渲染 empty slot', () => {
      const wrapper = mount(YdDashboardGrid, {
        props: { empty: true },
        slots: { empty: '<div class="empty-placeholder">暂无</div>' },
      });
      expect(wrapper.find('.empty-placeholder').exists()).toBe(true);
    });
  });
});
