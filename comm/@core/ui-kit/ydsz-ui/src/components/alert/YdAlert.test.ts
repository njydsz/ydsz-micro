/**
 * YdAlert 组件测试。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\alert\YdAlert.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

import { describe, expect, it } from 'vitest';

import YdAlert from './YdAlert.vue';
import YdAlertBanner from './YdAlertBanner.vue';

describe('YdAlert', () => {
  describe('渲染', () => {
    it('渲染 alert 角色', () => {
      const wrapper = mount(YdAlert, {
        slots: { default: '提示内容' },
      });
      expect(wrapper.attributes('role')).toBe('alert');
    });

    it('渲染默认 slot', () => {
      const wrapper = mount(YdAlert, {
        slots: { default: '提示内容' },
      });
      expect(wrapper.text()).toContain('提示内容');
    });

    it('含 aria-live=polite', () => {
      const wrapper = mount(YdAlert);
      expect(wrapper.attributes('aria-live')).toBe('polite');
    });
  });

  describe('type', () => {
    it('type=success 使用成功色', () => {
      const wrapper = mount(YdAlert, {
        props: { type: 'success' },
      });
      expect(wrapper.classes().join(' ')).toMatch(/green/);
    });

    it('type=error 使用错误色', () => {
      const wrapper = mount(YdAlert, {
        props: { type: 'error' },
      });
      expect(wrapper.classes().join(' ')).toMatch(/red|destructive/);
    });
  });

  describe('closable', () => {
    it('closable=true 时渲染关闭按钮', () => {
      const wrapper = mount(YdAlert, {
        props: { closable: true },
      });
      expect(wrapper.find('button').exists()).toBe(true);
    });

    it('点击关闭按钮触发 close 事件', async () => {
      const wrapper = mount(YdAlert, {
        props: { closable: true },
      });
      await wrapper.find('button').trigger('click');
      await nextTick();
      expect(wrapper.emitted('close')).toBeTruthy();
    });
  });
});

describe('YdAlertBanner', () => {
  it('渲染 alert 角色', () => {
    const wrapper = mount(YdAlertBanner, {
      props: { title: '横幅标题' },
      slots: { default: '横幅内容' },
    });
    expect(wrapper.attributes('role')).toBe('alert');
  });

  it('无 title 时不渲染', () => {
    const wrapper = mount(YdAlertBanner, {
      slots: { default: '内容' },
    });
    expect(wrapper.text()).toBe('');
  });

  it('渲染 title 与内容', () => {
    const wrapper = mount(YdAlertBanner, {
      props: { title: '标题' },
      slots: { default: '正文' },
    });
    expect(wrapper.text()).toContain('标题');
    expect(wrapper.text()).toContain('正文');
  });
});
