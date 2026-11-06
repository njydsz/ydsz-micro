/**
 * Splitter 拖拽分栏行为与 a11y 测试。
 *
 * @path comm\@core\ui-kit\ydsz-vue\src\Splitter\Splitter.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

import Splitter from './story/_Splitter.vue';

describe('Splitter 拖拽分栏', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('a11y', () => {
    it('通过 axe 无障碍检查', async () => {
      const wrapper = mount(Splitter);
      await nextTick();
      expect(
        await axe(wrapper.element, {
          rules: { label: { enabled: false } },
        }),
      ).toHaveNoViolations();
      wrapper.unmount();
    });
  });

  describe('渲染', () => {
    it('渲染分栏容器', async () => {
      const wrapper = mount(Splitter);
      await nextTick();
      expect(wrapper.element).toBeTruthy();
      wrapper.unmount();
    });

    it('渲染 resize handle（separator 角色）', async () => {
      const wrapper = mount(Splitter);
      await nextTick();
      const handles = wrapper.element.querySelectorAll('[role="separator"]');
      expect(handles.length).toBeGreaterThan(0);
      wrapper.unmount();
    });

    it('重复挂载不抛错', () => {
      expect(() => {
        const wrapper = mount(Splitter);
        wrapper.unmount();
      }).not.toThrow();
    });
  });

  describe('DOM 结构', () => {
    it('handle 带方向标识（aria 或 data）', async () => {
      const wrapper = mount(Splitter);
      await nextTick();
      const handles = wrapper.element.querySelectorAll('[role="separator"]');
      const first = handles[0] as HTMLElement | undefined;
      if (first) {
        const aria = first.getAttribute('aria-orientation');
        const data = first.getAttribute('data-orientation');
        expect(aria || data).toBeTruthy();
      }
      wrapper.unmount();
    });
  });
});
