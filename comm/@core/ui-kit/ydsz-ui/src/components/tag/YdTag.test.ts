/**
 * YdTag 组件测试。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\tag\YdTag.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { mount } from '@vue/test-utils';

import { describe, expect, it } from 'vitest';

import YdTag from './YdTag.vue';

// mock locale（绕过 en-US.ts 既有语法错误）

describe('YdTag', () => {
  describe('渲染', () => {
    it('默认渲染 span 与文本', () => {
      const wrapper = mount(YdTag, {
        slots: { default: '标签' },
      });
      expect(wrapper.element.tagName).toBe('SPAN');
      expect(wrapper.text()).toContain('标签');
    });

    it('基础类名包含 rounded-full', () => {
      const wrapper = mount(YdTag);
      expect(wrapper.classes()).toContain('rounded-full');
    });
  });

  describe('variant', () => {
    it('variant=success 使用 success 色', () => {
      const wrapper = mount(YdTag, {
        props: { variant: 'success' },
      });
      expect(wrapper.classes().join(' ')).toMatch(/success/);
    });

    it('variant=destructive 使用 destructive 色', () => {
      const wrapper = mount(YdTag, {
        props: { variant: 'destructive' },
      });
      expect(wrapper.classes().join(' ')).toMatch(/destructive/);
    });
  });

  describe('size', () => {
    it('size=lg 使用更大尺寸类', () => {
      const wrapper = mount(YdTag, {
        props: { size: 'lg' },
      });
      expect(wrapper.classes().join(' ')).toMatch(/text-sm/);
    });
  });

  describe('closable', () => {
    it('closable=true 时渲染关闭按钮', () => {
      const wrapper = mount(YdTag, {
        props: { closable: true },
        slots: { default: '可关闭' },
      });
      const btn = wrapper.find('button');
      expect(btn.exists()).toBe(true);
    });

    it('点击关闭按钮触发 close 事件', async () => {
      const wrapper = mount(YdTag, {
        props: { closable: true },
      });
      await wrapper.find('button').trigger('click');
      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('closable=false 时无关闭按钮', () => {
      const wrapper = mount(YdTag, {
        props: { closable: false },
      });
      expect(wrapper.find('button').exists()).toBe(false);
    });
  });

  describe('slots', () => {
    it('icon slot 渲染前置图标', () => {
      const wrapper = mount(YdTag, {
        slots: { icon: '<span class="tag-icon">i</span>', default: '文本' },
      });
      expect(wrapper.find('.tag-icon').exists()).toBe(true);
    });
  });
});
