/**
 * YdCollapse 组件测试。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\collapse\YdCollapse.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { mount } from '@vue/test-utils';
import { h } from 'vue';

import { describe, expect, it } from 'vitest';

import YdCollapse from './YdCollapse.vue';
import YdCollapseItem from './YdCollapseItem.vue';

/** 构造默认 slot（函数式，确保 provide/inject 生效） */
function defaultSlot(...items: Array<{ key: string; title: string; disabled?: boolean }>) {
  return () =>
    items.map((item) =>
      h(
        YdCollapseItem,
        { key: item.key, title: item.title, disabled: item.disabled },
        { default: () => `内容${item.key}` },
      ),
    );
}

describe('YdCollapse', () => {
  describe('渲染', () => {
    it('渲染容器', () => {
      const wrapper = mount(YdCollapse, {
        slots: { default: defaultSlot({ key: 'a', title: '标题' }) },
      });
      expect(wrapper.exists()).toBe(true);
    });

    it('渲染标题', () => {
      const wrapper = mount(YdCollapse, {
        slots: { default: defaultSlot({ key: 'a', title: '标题' }) },
      });
      expect(wrapper.text()).toContain('标题');
    });
  });

  describe('展开/收起', () => {
    it('点击触发器切换 aria-expanded', async () => {
      const wrapper = mount(YdCollapse, {
        slots: { default: defaultSlot({ key: 'a', title: '标题' }) },
      });
      const btn = wrapper.find('button');
      expect(btn.attributes('aria-expanded')).toBe('false');
      await btn.trigger('click');
      expect(wrapper.find('button').attributes('aria-expanded')).toBe('true');
    });

    it('点击触发 change 事件', async () => {
      const wrapper = mount(YdCollapse, {
        slots: { default: defaultSlot({ key: 'a', title: '标题' }) },
      });
      await wrapper.find('button').trigger('click');
      expect(wrapper.emitted('change')).toBeTruthy();
    });

    it('defaultActiveKeys prop 被接受（不报错）', () => {
      const wrapper = mount(YdCollapse, {
        props: { defaultActiveKeys: ['a'] },
        slots: { default: defaultSlot({ key: 'a', title: '标题' }) },
      });
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('disabled', () => {
    it('disabled 项点击不触发 toggle', async () => {
      const wrapper = mount(YdCollapse, {
        slots: { default: defaultSlot({ key: 'a', title: '标题', disabled: true }) },
      });
      await wrapper.find('button').trigger('click');
      expect(wrapper.find('button').attributes('aria-expanded')).toBe('false');
    });
  });

  describe('accordion', () => {
    it('accordion prop 被接受（多面板渲染）', () => {
      const wrapper = mount(YdCollapse, {
        props: { accordion: true },
        slots: {
          default: defaultSlot({ key: 'a', title: 'A' }, { key: 'b', title: 'B' }),
        },
      });
      expect(wrapper.findAll('button').length).toBe(2);
    });
  });
});
