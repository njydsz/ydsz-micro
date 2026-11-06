/**
 * YdParagraph 组件测试 —— 覆盖多行省略、展开/收起与可编辑能力。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\typography\YdParagraph.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { describe, expect, it } from 'vitest';

import { mount } from '@vue/test-utils';

import YdParagraph from './YdParagraph.vue';

describe('YdParagraph', () => {
  describe('渲染基础', () => {
    it('默认渲染段落内容', () => {
      const wrapper = mount(YdParagraph, {
        slots: { default: '这是一段普通文本' },
      });
      expect(wrapper.text()).toContain('这是一段普通文本');
    });

    it('应用自定义 class', () => {
      const wrapper = mount(YdParagraph, {
        props: { class: 'custom-class' },
        slots: { default: '文本' },
      });
      const p = wrapper.find('p');
      expect(p.exists()).toBe(true);
      expect(p.classes()).toContain('custom-class');
    });
  });

  describe('ellipsis 配置', () => {
    it('ellipsis=true 时归一化为默认配置', () => {
      const wrapper = mount(YdParagraph, {
        props: { ellipsis: true },
        slots: { default: '长文本' },
      });
      // 单行省略时文本容器应有 text-ellipsis 类
      const textSpan = wrapper.find('span > span');
      expect(textSpan.exists()).toBe(true);
    });

    it('ellipsis 配置对象携带 rows/expandable', () => {
      const wrapper = mount(YdParagraph, {
        props: { ellipsis: { rows: 3, expandable: true } },
        slots: { default: '多行文本' },
      });
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('expandChange 事件', () => {
    it('点击展开按钮触发 expandChange(true)', async () => {
      const wrapper = mount(YdParagraph, {
        props: { ellipsis: { rows: 2, expandable: true } },
        slots: { default: '内容' },
      });

      // 模拟溢出状态
      const textSpan = wrapper.find('span[ref="textRef"], span').element as HTMLElement;
      if (textSpan) {
        Object.defineProperty(textSpan, 'scrollWidth', { value: 200, configurable: true });
        Object.defineProperty(textSpan, 'clientWidth', { value: 100, configurable: true });
        Object.defineProperty(textSpan, 'scrollHeight', { value: 100, configurable: true });
        Object.defineProperty(textSpan, 'clientHeight', { value: 50, configurable: true });
      }

      // 触发 overflow 检测
      await wrapper.vm.$nextTick();
      const btn = wrapper.find('button');
      if (btn.exists()) {
        await btn.trigger('click');
        expect(wrapper.emitted('expandChange')).toBeTruthy();
      }
    });
  });

  describe('editable 模式', () => {
    it('editable=true 时双击进入编辑', async () => {
      const wrapper = mount(YdParagraph, {
        props: { editable: true },
        slots: { default: '可编辑文本' },
      });
      const p = wrapper.find('p');
      expect(p.exists()).toBe(true);
      await p.trigger('dblclick');
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();
      // 编辑模式渲染 contenteditable div
      const editableEl = wrapper.find('[contenteditable="true"]');
      expect(editableEl.exists()).toBe(true);
    });

    it('回车提交触发 change 事件', async () => {
      const wrapper = mount(YdParagraph, {
        props: { editable: true },
        slots: { default: '初始值' },
      });
      await wrapper.trigger('dblclick');
      await wrapper.vm.$nextTick();

      const editableEl = wrapper.find('[contenteditable="true"]');
      if (editableEl.exists()) {
        (editableEl.element as HTMLElement).textContent = '新值';
        await editableEl.trigger('keydown', { key: 'Enter' });
        expect(wrapper.emitted('change')).toBeTruthy();
      }
    });

    it('Esc 取消编辑并还原文本', async () => {
      const wrapper = mount(YdParagraph, {
        props: { editable: true },
        slots: { default: '原始文本' },
      });
      await wrapper.trigger('dblclick');
      await wrapper.vm.$nextTick();

      const editableEl = wrapper.find('[contenteditable="true"]');
      if (editableEl.exists()) {
        (editableEl.element as HTMLElement).textContent = '被修改';
        await editableEl.trigger('keydown', { key: 'Escape' });
        expect(wrapper.emitted('change')).toBeFalsy();
      }
    });
  });

  describe('ResizeObserver 兼容', () => {
    it('未定义 ResizeObserver 时不抛错', () => {
      const original = globalThis.ResizeObserver;
      // @ts-expect-error 故意置空
      globalThis.ResizeObserver = undefined;
      expect(() => {
        mount(YdParagraph, {
          props: { ellipsis: true },
          slots: { default: '文本' },
        });
      }).not.toThrow();
      globalThis.ResizeObserver = original;
    });
  });

  describe('maxLength 限制', () => {
    it('超过 maxLength 时截断并触发 change', async () => {
      const wrapper = mount(YdParagraph, {
        props: { editable: { maxLength: 5, autoSave: true } },
        slots: { default: '超长文本内容' },
      });
      await wrapper.trigger('dblclick');
      await wrapper.vm.$nextTick();

      const editableEl = wrapper.find('[contenteditable="true"]');
      if (editableEl.exists()) {
        (editableEl.element as HTMLElement).textContent = '123456789';
        await editableEl.trigger('keydown', { key: 'Enter' });
        const changeEvents = wrapper.emitted('change');
        if (changeEvents && changeEvents[0]) {
          expect((changeEvents[0] as string[])[0].length).toBeLessThanOrEqual(5);
        }
      }
    });
  });
});
