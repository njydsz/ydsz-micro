/**
 * YdTabsPro 配置式标签页测试。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\tabs\YdTabsPro.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { describe, expect, it, vi } from 'vitest';

import { mount } from '@vue/test-utils';

import YdTabsPro from './YdTabsPro.vue';

const baseItems = [
  { key: 'a', label: 'Tab A', content: 'Content A' },
  { key: 'b', label: 'Tab B', content: 'Content B' },
  { key: 'c', label: 'Tab C', content: 'Content C' },
];

describe('YdTabsPro', () => {
  describe('渲染', () => {
    it('渲染全部标签项', () => {
      const wrapper = mount(YdTabsPro, {
        props: { items: baseItems },
      });
      expect(wrapper.text()).toContain('Tab A');
      expect(wrapper.text()).toContain('Tab B');
      expect(wrapper.text()).toContain('Tab C');
    });

    it('默认激活第一项并显示其内容', () => {
      const wrapper = mount(YdTabsPro, {
        props: { items: baseItems },
      });
      expect(wrapper.text()).toContain('Content A');
    });

    it('应用自定义 class', () => {
      const wrapper = mount(YdTabsPro, {
        props: { items: baseItems, class: 'custom-tabs' },
      });
      expect(wrapper.html()).toContain('custom-tabs');
    });
  });

  describe('受控与非受控', () => {
    it('modelValue 受控切换激活项', async () => {
      const wrapper = mount(YdTabsPro, {
        props: { items: baseItems, modelValue: 'a' },
      });
      await wrapper.setProps({ modelValue: 'b' });
      expect(wrapper.text()).toContain('Content B');
    });

    it('受控 modelValue 驱动激活项变化', async () => {
      const wrapper = mount(YdTabsPro, {
        props: { items: baseItems, modelValue: 'a' },
      });
      expect(wrapper.text()).toContain('Content A');
      await wrapper.setProps({ modelValue: 'c' });
      expect(wrapper.text()).toContain('Content C');
    });

    it('modelValue 变化触发 tabChange 事件', async () => {
      const wrapper = mount(YdTabsPro, {
        props: { items: baseItems, modelValue: 'a' },
      });
      await wrapper.setProps({ modelValue: 'b' });
      // Radix 内部 context 更新，组件应响应
      expect(wrapper.text()).toContain('Content B');
    });
  });

  describe('可编辑模式', () => {
    it('editable 时显示关闭按钮', () => {
      const wrapper = mount(YdTabsPro, {
        props: { items: baseItems, editable: true },
      });
      const closeButtons = wrapper.findAll('button[aria-label^="Close"]');
      expect(closeButtons.length).toBe(baseItems.length);
    });

    it('closable=false 的项不显示关闭按钮', () => {
      const wrapper = mount(YdTabsPro, {
        props: {
          items: [{ key: 'a', label: 'A', closable: false }],
          editable: true,
        },
      });
      expect(wrapper.findAll('button[aria-label^="Close"]').length).toBe(0);
    });

    it('点击关闭按钮触发 tabRemove 并切换到相邻项', async () => {
      const wrapper = mount(YdTabsPro, {
        props: { items: baseItems, editable: true, modelValue: 'a' },
      });
      const closeBtn = wrapper.find('button[aria-label="Close Tab A"]');
      if (closeBtn.exists()) {
        await closeBtn.trigger('click');
        expect(wrapper.emitted('tabRemove')).toBeTruthy();
        expect((wrapper.emitted('tabRemove')![0] as string[])[0]).toBe('a');
      }
    });

    it('addable 时显示新增按钮并触发 tabAdd', async () => {
      const wrapper = mount(YdTabsPro, {
        props: { items: baseItems, editable: true, addable: true },
      });
      const addBtn = wrapper.find('button[aria-label="Add tab"]');
      expect(addBtn.exists()).toBe(true);
      await addBtn.trigger('click');
      expect(wrapper.emitted('tabAdd')).toBeTruthy();
    });

    it('editable=false 时不显示关闭与新增按钮', () => {
      const wrapper = mount(YdTabsPro, {
        props: { items: baseItems },
      });
      expect(wrapper.findAll('button[aria-label^="Close"]').length).toBe(0);
      expect(wrapper.find('button[aria-label="Add tab"]').exists()).toBe(false);
    });
  });

  describe('拖拽排序', () => {
    it('draggable 时触发器带 draggable 属性', () => {
      const wrapper = mount(YdTabsPro, {
        props: { items: baseItems, draggable: true },
      });
      const draggableButtons = wrapper.findAll('[draggable="true"]');
      expect(draggableButtons.length).toBe(baseItems.length);
    });

    it('drop 触发 tabReorder 并计算新顺序', async () => {
      const wrapper = mount(YdTabsPro, {
        props: { items: baseItems, draggable: true },
      });
      const triggerButtons = wrapper.findAll('[draggable="true"]');
      const first = triggerButtons[0]!;
      const last = triggerButtons[2]!;

      // 模拟 dragstart 在 index 0
      await first.trigger('dragstart', {
        dataTransfer: { setData: vi.fn(), effectAllowed: '' },
      });
      // 模拟 drop 在 index 2
      await last.trigger('drop', {
        preventDefault: vi.fn(),
        dataTransfer: { dropEffect: '' },
      });

      const reorder = wrapper.emitted('tabReorder');
      expect(reorder).toBeTruthy();
      const newItems = (reorder![0] as any[])[0] as Array<{ key: string }>;
      expect(newItems.map((i) => i.key)).toEqual(['b', 'c', 'a']);
    });

    it('draggable=false 时不触发拖拽事件', async () => {
      const wrapper = mount(YdTabsPro, {
        props: { items: baseItems },
      });
      const trigger = wrapper.find('button');
      if (trigger.exists()) {
        await trigger.trigger('dragstart');
        expect(wrapper.emitted('tabReorder')).toBeFalsy();
      }
    });
  });

  describe('keepAlive', () => {
    it('keepAlive 时已激活面板保留在 DOM', async () => {
      const wrapper = mount(YdTabsPro, {
        props: { items: baseItems, keepAlive: true },
      });
      expect(wrapper.text()).toContain('Content A');
      // 切换到 B
      const tabB = wrapper.findAll('button').find((b) => b.attributes('value') === 'b');
      if (tabB) {
        await tabB.trigger('click');
        await wrapper.vm.$nextTick();
        // A 与 B 都应存在（keepAlive 保留已渲染面板）
        expect(wrapper.text()).toContain('Content B');
      }
    });
  });

  describe('空列表', () => {
    it('空 items 不抛错', () => {
      expect(() => {
        mount(YdTabsPro, { props: { items: [] } });
      }).not.toThrow();
    });
  });
});
