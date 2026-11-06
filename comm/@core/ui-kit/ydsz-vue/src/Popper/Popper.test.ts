/**
 * Popper 定位基座测试。
 *
 * @path comm\@core\ui-kit\ydsz-vue\src\Popper\Popper.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';

import Popper from './_Popper.vue';

describe('Popper 定位基座', () => {
  globalThis.ResizeObserver = class ResizeObserver {
    disconnect() {}
    observe() {}
    unobserve() {}
  };

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('渲染正确并匹配快照', async () => {
    const wrapper = mount(Popper, { attachTo: document.body });
    expect(wrapper.element).toMatchSnapshot();
    wrapper.unmount();
  });

  it('挂载到 body 不抛错', () => {
    expect(() => {
      const wrapper = mount(Popper, { attachTo: document.body });
      wrapper.unmount();
    }).not.toThrow();
  });

  it('ResizeObserver 存在时正常工作', () => {
    expect(globalThis.ResizeObserver).toBeDefined();
    const wrapper = mount(Popper, { attachTo: document.body });
    expect(wrapper.element).toBeTruthy();
    wrapper.unmount();
  });

  it('重复挂载/卸载不抛错', () => {
    const wrapper1 = mount(Popper, { attachTo: document.body });
    wrapper1.unmount();
    const wrapper2 = mount(Popper, { attachTo: document.body });
    wrapper2.unmount();
    expect(document.body.innerHTML).toBe('');
  });
});
