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
 *   <li>ESC 只关最上层、焦点入栏与归还、body 滚动锁定、Teleport 落位</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\drawer\drawer.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { afterEach, describe, expect, it } from 'vitest';

import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

import YdDrawer from './YdDrawer.vue';
import { __resetOverlayEscapeStackForTests } from '../../composables/use-overlay-escape';
import type { YdDrawerProps } from './types';

/** 记录 mountDrawer 创建的实例，afterEach 统一卸载以免滚动锁与 ESC 栈跨用例残留 */
const mountedWrappers: Array<{ unmount: () => void }> = [];

afterEach(() => {
  for (const wrapper of mountedWrappers) wrapper.unmount();
  mountedWrappers.length = 0;
  document.body.innerHTML = '';
  document.body.style.overflow = '';
  __resetOverlayEscapeStackForTests();
});

/**
 * 创建 YdDrawer 测试包装器。
 */
function mountDrawer(props?: Partial<YdDrawerProps>) {
  const wrapper = mount(YdDrawer, {
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
  mountedWrappers.push(wrapper);
  return wrapper;
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
      global: {
        stubs: {
          teleport: true,
        },
      },
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
    wrapper2.unmount();
  });
});

describe('YdDrawer 交互契约', () => {
  /**
   * 等待退场过渡跑完。
   *
   * <p>真实 Transition 的 after-leave 依赖两次 requestAnimationFrame，耗时随环境抖动，
   * 因此轮询 closed 事件而不是固定 sleep。
   */
  async function settleTransition(wrapper: { emitted: (e: string) => unknown[] | undefined }): Promise<void> {
    for (let i = 0; i < 40; i++) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      if (wrapper.emitted('closed')) {
        await nextTick();
        return;
      }
    }
    throw new Error('[YdDrawer] 退场过渡未触发 closed 事件');
  }

  it('ESC 键应触发 close("esc") 并请求关闭', async () => {
    __resetOverlayEscapeStackForTests();
    const wrapper = mountDrawer({ open: true });

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await nextTick();

    expect(wrapper.emitted('close')?.[0]).toEqual(['esc']);
    expect(wrapper.emitted('update:open')?.[0]).toEqual([false]);
    wrapper.unmount();
    __resetOverlayEscapeStackForTests();
  });

  it('closeOnEsc=false 时 ESC 不应关闭', async () => {
    __resetOverlayEscapeStackForTests();
    const wrapper = mountDrawer({ closeOnEsc: false, open: true });

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await nextTick();

    expect(wrapper.emitted('close')).toBeUndefined();
    wrapper.unmount();
    __resetOverlayEscapeStackForTests();
  });

  it('嵌套抽屉的 ESC 只关闭最上层', async () => {
    __resetOverlayEscapeStackForTests();
    const outer = mountDrawer({ open: true });
    const inner = mountDrawer({ header: '内层', open: true });

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await nextTick();

    expect(inner.emitted('close')?.[0]).toEqual(['esc']);
    expect(outer.emitted('close')).toBeUndefined();
    outer.unmount();
    inner.unmount();
    __resetOverlayEscapeStackForTests();
  });

  it('点击遮罩应带上 close("mask") 原因', async () => {
    const wrapper = mountDrawer({ open: true });

    await wrapper.find('.yd-drawer-overlay').trigger('click');
    expect(wrapper.emitted('close')?.[0]).toEqual(['mask']);
    wrapper.unmount();
  });

  it('面板与遮罩应恢复指针事件命中', async () => {
    const wrapper = mountDrawer({ open: true });
    // 命令式宿主容器是 pointer-events:none，面板必须自己恢复，否则整屏点击穿透
    expect(wrapper.find('.yd-drawer-content').classes()).toContain('pointer-events-auto');
    expect(wrapper.find('.yd-drawer-overlay').classes()).toContain('pointer-events-auto');
    wrapper.unmount();
  });

  it('打开时聚焦面板内首个可聚焦元素，关闭后归还焦点', async () => {
    __resetOverlayEscapeStackForTests();
    const trigger = document.createElement('button');
    trigger.textContent = '打开抽屉';
    document.body.append(trigger);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    const wrapper = mountDrawer({ open: false });
    await wrapper.setProps({ open: true });
    await nextTick();
    await nextTick();

    const dialog = wrapper.find('[role="dialog"]').element;
    expect(dialog.contains(document.activeElement)).toBe(true);

    await wrapper.setProps({ open: false });
    await nextTick();
    expect(document.activeElement).toBe(trigger);

    wrapper.unmount();
    trigger.remove();
  });

  it('打开时锁定 body 滚动，关闭后恢复', async () => {
    const wrapper = mountDrawer({ open: false });
    expect(document.body.style.overflow).not.toBe('hidden');

    await wrapper.setProps({ open: true });
    await nextTick();
    expect(document.body.style.overflow).toBe('hidden');

    await wrapper.setProps({ open: false });
    await nextTick();
    expect(document.body.style.overflow).not.toBe('hidden');
    wrapper.unmount();
  });

  it('未打开时不应渲染插槽内容（懒挂载）', () => {
    const wrapper = mount(YdDrawer, {
      props: { open: false },
      slots: { default: '<p class="lazy-content">内容</p>' },
      global: { stubs: { teleport: true } },
    });

    expect(wrapper.find('.lazy-content').exists()).toBe(false);
    wrapper.unmount();
  });

  it('destroyOnClose=true 关闭后销毁内容，false 时保留', async () => {
    /**
     * <p>必须用真实 Teleport：@vue/test-utils 的 teleport 桩会把子节点挂到桩组件内部，
     * Transition 的 after-leave 因此不触发，destroyOnClose 与 closed 事件都无法断言。
     */
    const destroy = mount(YdDrawer, {
      attachTo: document.body,
      props: { destroyOnClose: true, open: true },
      slots: { default: '<p class="lazy-content">内容</p>' },
      global: { stubs: { transition: false } },
    });
    expect(document.body.querySelector('.lazy-content')).not.toBeNull();

    await destroy.setProps({ open: false });
    await settleTransition(destroy);
    expect(document.body.querySelector('.lazy-content')).toBeNull();
    destroy.unmount();

    const keep = mount(YdDrawer, {
      attachTo: document.body,
      props: { destroyOnClose: false, open: true },
      slots: { default: '<p class="keep-content">内容</p>' },
      global: { stubs: { transition: false } },
    });
    await keep.setProps({ open: false });
    await settleTransition(keep);
    expect(document.body.querySelector('.keep-content')).not.toBeNull();
    keep.unmount();
  });

  it('appendTo=false 原地渲染，默认 Teleport 到 body', () => {
    const inPlace = mount(YdDrawer, {
      props: { appendTo: false, open: true },
    });
    expect(inPlace.find('[role="dialog"]').exists()).toBe(true);
    inPlace.unmount();

    const teleported = mount(YdDrawer, {
      attachTo: document.body,
      props: { header: '传送抽屉', open: true },
    });
    // 未 stub 时内容应落在 body 上，而不是组件包装器内
    expect(teleported.find('[role="dialog"]').exists()).toBe(false);
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull();
    teleported.unmount();
  });
});
