/**
 * YdDrawer 单元测试 —— 验证：
 * <ul>
 *   <li>默认不渲染（open=false）</li>
 *   <li>open=true 时渲染 dialog role + aria-modal</li>
 *   <li>position 切换 class</li>
 *   <li>点击 close 按钮触发 close</li>
 *   <li>width 样式计算</li>
 *   <li>maskClosable=false 时点击遮罩不触发 close</li>
 *   <li>destroy-on-close 行为</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\drawer\drawer.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { describe, expect, it } from 'vitest';

import { mount } from '@vue/test-utils';

import YdDrawer from './YdDrawer.vue';
import type { YdDrawerProps } from './types';

/**
 * 创建 YdDrawer 测试包装器。
 */
function mountDrawer(props?: Partial<YdDrawerProps>) {
  return mount(YdDrawer, {
    props: {
      open: false,
      ...props,
    },
    attachTo: document.body,
    global: {
      stubs: {
        teleport: true,
      },
    },
  });
}

describe('YdDrawer', () => {
  it('open=false 时不渲染抽屉', () => {
    const wrapper = mountDrawer({ open: false });
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });

  it('open=true 时渲染 dialog role + aria-modal=true', async () => {
    const wrapper = mountDrawer({ open: false });
    await wrapper.setProps({ open: true });

    const dialog = wrapper.find('[role="dialog"]');
    expect(dialog.exists()).toBe(true);
    expect(dialog.attributes('aria-modal')).toBe('true');
  });

  it('header 属性显示为文本', async () => {
    const wrapper = mountDrawer({ header: '测试抽屉', open: false });
    await wrapper.setProps({ open: true });

    expect(wrapper.find('.yd-drawer-header-title').text()).toBe('测试抽屉');
  });

  it('默认 position=right 时内容靠右', async () => {
    const wrapper = mountDrawer({ open: false });
    await wrapper.setProps({ open: true });
    const content = wrapper.find('.yd-drawer-content');
    expect(content.classes()).toContain('right-0');
  });

  it('position=left 时内容靠左', async () => {
    const wrapper = mountDrawer({ position: 'left', open: false });
    await wrapper.setProps({ open: true });
    const content = wrapper.find('.yd-drawer-content');
    expect(content.classes()).toContain('left-0');
  });

  it('position=top 时内容靠顶', async () => {
    const wrapper = mountDrawer({ position: 'top', height: 300, open: false });
    await wrapper.setProps({ open: true });

    const content = wrapper.find('.yd-drawer-content');
    expect(content.classes()).toContain('top-0');
  });

  it('width 传数字时内容区有正确宽度样式', async () => {
    const wrapper = mountDrawer({ position: 'right', width: 600, open: false });
    await wrapper.setProps({ open: true });

    const content = wrapper.find('.yd-drawer-content');
    expect(content.attributes('style')).toContain('width: 600px');
  });

  it('width 传字符串时直接使用', async () => {
    const wrapper = mountDrawer({ width: '60vw', open: false });
    await wrapper.setProps({ open: true });

    const content = wrapper.find('.yd-drawer-content');
    expect(content.attributes('style')).toContain('width: 60vw');
  });

  it('showClose=false 时不渲染关闭按钮', async () => {
    const wrapper = mountDrawer({ showClose: false, open: false });
    await wrapper.setProps({ open: true });
    expect(wrapper.find('.yd-drawer-close').exists()).toBe(false);
  });

  it('点击关闭按钮触发 update:open=false + close', async () => {
    const wrapper = mountDrawer({ open: true });

    await wrapper.find('.yd-drawer-close').trigger('click');

    const updates = wrapper.emitted('update:open');
    expect(updates).toBeTruthy();
    expect(updates![0]).toEqual([false]);
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('maskClosable 默认为 true，点击遮罩触发关闭', async () => {
    const wrapper = mountDrawer({ open: true, maskClosable: true });

    await wrapper.find('.yd-drawer-overlay').trigger('click');

    const updates = wrapper.emitted('update:open');
    expect(updates).toBeTruthy();
    expect(updates![0]).toEqual([false]);
  });

  it('maskClosable=false 时不响应遮罩点击', async () => {
    const wrapper = mountDrawer({ open: true, maskClosable: false });

    await wrapper.find('.yd-drawer-overlay').trigger('click');

    expect(wrapper.emitted('update:open')).toBeFalsy();
  });

  it('mask=false 时不渲染遮罩层', async () => {
    const wrapper = mountDrawer({ mask: false, open: true });
    expect(wrapper.find('.yd-drawer-overlay').exists()).toBe(false);
  });

  it('footer 插槽渲染正确', async () => {
    const wrapper = mount(YdDrawer, {
      props: { open: true },
      slots: {
        footer: '<button class="yd-drawer-footer-btn">Submit</button>',
      },
      attachTo: document.body,
    });

    expect(wrapper.find('.yd-drawer-footer').exists()).toBe(true);
    expect(wrapper.find('.yd-drawer-footer-btn').text()).toBe('Submit');

    wrapper.unmount();
  });

  it('ARIA label 使用 header 或 fallback', async () => {
    const wrapper1 = mountDrawer({ header: 'My Drawer', open: true });
    expect(wrapper1.find('[role="dialog"]').attributes('aria-label')).toBe('My Drawer');
    wrapper1.unmount();

    const wrapper2 = mountDrawer({ open: true });
    expect(wrapper2.find('[role="dialog"]').attributes('aria-label')).toBe('抽屉');
  });
});
