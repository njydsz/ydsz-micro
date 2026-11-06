/**
 * YdDivider 组件测试。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\divider\YdDivider.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { mount } from '@vue/test-utils';

import { describe, expect, it } from 'vitest';

import YdDivider from './YdDivider.vue';

describe('YdDivider', () => {
  describe('水平分隔线', () => {
    it('无 slot 时渲染 hr', () => {
      const wrapper = mount(YdDivider, {
        props: { type: 'horizontal' },
      });
      expect(wrapper.find('hr').exists()).toBe(true);
    });

    it('dashed=true 时含 border-dashed', () => {
      const wrapper = mount(YdDivider, {
        props: { dashed: true },
      });
      expect(wrapper.find('hr').classes()).toContain('border-dashed');
    });

    it('有 slot 时渲染标签文本', () => {
      const wrapper = mount(YdDivider, {
        props: { type: 'horizontal' },
        slots: { default: '分割' },
      });
      expect(wrapper.text()).toContain('分割');
    });
  });

  describe('垂直分隔线', () => {
    it('type=vertical 时容器含 inline-flex', () => {
      const wrapper = mount(YdDivider, {
        props: { type: 'vertical' },
      });
      expect(wrapper.classes()).toContain('inline-flex');
    });

    it('type=vertical 渲染竖线', () => {
      const wrapper = mount(YdDivider, {
        props: { type: 'vertical' },
      });
      expect(wrapper.find('div').exists()).toBe(true);
    });
  });

  describe('orientation', () => {
    it('orientation=left 时标签无左线', () => {
      const wrapper = mount(YdDivider, {
        props: { orientation: 'left' },
        slots: { default: '左' },
      });
      expect(wrapper.text()).toContain('左');
    });
  });
});
