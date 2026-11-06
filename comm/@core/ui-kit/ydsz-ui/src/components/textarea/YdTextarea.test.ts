/**
 * YdTextarea 组件测试。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\textarea\YdTextarea.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { mount } from '@vue/test-utils';

import { describe, expect, it } from 'vitest';

import YdTextarea from './YdTextarea.vue';

describe('YdTextarea', () => {
  describe('渲染', () => {
    it('渲染原生 textarea', () => {
      const wrapper = mount(YdTextarea);
      expect(wrapper.find('textarea').exists()).toBe(true);
    });

    it('placeholder 透传', () => {
      const wrapper = mount(YdTextarea, {
        props: { placeholder: '请输入内容' },
      });
      expect(wrapper.find('textarea').attributes('placeholder')).toBe('请输入内容');
    });

    it('maxlength 透传', () => {
      const wrapper = mount(YdTextarea, {
        props: { maxlength: 100 },
      });
      expect(wrapper.find('textarea').attributes('maxlength')).toBe('100');
    });
  });

  describe('双向绑定', () => {
    it('输入触发 update:modelValue', async () => {
      const wrapper = mount(YdTextarea, {
        props: { modelValue: '' },
      });
      await wrapper.find('textarea').setValue('新内容');
      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    });

    it('modelValue 同步到 textarea', async () => {
      const wrapper = mount(YdTextarea, {
        props: { modelValue: '初始值' },
      });
      expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('初始值');
    });
  });

  describe('resize', () => {
    it('resize=none 含 resize-none 类', () => {
      const wrapper = mount(YdTextarea, {
        props: { resize: 'none' },
      });
      expect(wrapper.find('textarea').classes()).toContain('resize-none');
    });
  });

  describe('字数统计', () => {
    it('isShowCount=true 时渲染统计', () => {
      const wrapper = mount(YdTextarea, {
        props: { modelValue: 'abc', isShowCount: true },
      });
      expect(wrapper.text()).toContain('3');
    });
  });

  describe('disabled', () => {
    it('disabled 时 textarea 禁用', () => {
      const wrapper = mount(YdTextarea, {
        props: { disabled: true },
      });
      expect(wrapper.find('textarea').attributes('disabled')).toBeDefined();
    });
  });
});
