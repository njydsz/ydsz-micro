/**
 * YdAccordion 组件测试。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\accordion\YdAccordion.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { mount } from '@vue/test-utils';

import { describe, expect, it } from 'vitest';

import YdAccordion from './YdAccordion.vue';

describe('YdAccordion', () => {
  describe('渲染', () => {
    it('渲染容器', () => {
      const wrapper = mount(YdAccordion, {
        props: { type: 'single' },
      });
      expect(wrapper.exists()).toBe(true);
    });

    it('应用自定义 class', () => {
      const wrapper = mount(YdAccordion, {
        props: { type: 'single', class: 'custom-accordion' },
      });
      expect(wrapper.classes()).toContain('custom-accordion');
    });

    it('渲染默认 slot', () => {
      const wrapper = mount(YdAccordion, {
        props: { type: 'single' },
        slots: { default: '内容' },
      });
      expect(wrapper.text()).toContain('内容');
    });
  });

  describe('type', () => {
    it('type=multiple 渲染容器', () => {
      const wrapper = mount(YdAccordion, {
        props: { type: 'multiple' },
      });
      expect(wrapper.exists()).toBe(true);
    });
  });
});
