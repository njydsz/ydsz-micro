/**
 * YdSegmented 组件测试。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\segmented\YdSegmented.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

import { describe, expect, it } from 'vitest';

import YdSegmented from './YdSegmented.vue';

const tabs = [
  { label: '日', value: 'day' },
  { label: '周', value: 'week' },
  { label: '月', value: 'month' },
];

describe('YdSegmented', () => {
  describe('渲染', () => {
    it('渲染 tablist 角色', () => {
      const wrapper = mount(YdSegmented, {
        props: { tabs },
      });
      expect(wrapper.find('[role="tablist"]').exists()).toBe(true);
    });

    it('渲染全部 tab 项', () => {
      const wrapper = mount(YdSegmented, {
        props: { tabs },
      });
      expect(wrapper.findAll('[role="tab"]').length).toBe(3);
    });

    it('渲染 tab 标签文本', () => {
      const wrapper = mount(YdSegmented, {
        props: { tabs },
      });
      expect(wrapper.text()).toContain('日');
      expect(wrapper.text()).toContain('周');
      expect(wrapper.text()).toContain('月');
    });
  });

  describe('交互', () => {
    it('点击 tab 不抛错', async () => {
      const wrapper = mount(YdSegmented, {
        props: { tabs, modelValue: 'day' },
      });
      const tabButtons = wrapper.findAll('[role="tab"]');
      if (tabButtons.length > 1) {
        await tabButtons[1]!.trigger('click');
        await nextTick();
        expect(wrapper.exists()).toBe(true);
      }
    });
  });

  describe('空 tabs', () => {
    it('空 tabs 不抛错', () => {
      expect(() => {
        mount(YdSegmented, { props: { tabs: [] } });
      }).not.toThrow();
    });
  });
});
