/**
 * YdDrawer 组件测试 —— 声明式侧滑抽屉：开关定位、关闭行为与布局插槽。
 *
 * <p>覆盖能力：
 * <ul>
 *   <li>v-model:open 受控开关</li>
 *   <li>position 四向定位（left/right/top/bottom）</li>
 *   <li>width/height 尺寸支持数字与字符串</li>
 *   <li>showClose 控制关闭按钮显隐</li>
 *   <li>maskClosable 遮罩点击行为</li>
 *   <li>mask=false 时不渲染遮罩</li>
 *   <li>三厢布局：header/body/footer 插槽</li>
 * </ul>
 *
 * <p>注意：Teleport 桩模式下内容仍留在组件子树中，面板 v-show 切换时
 * display:none 但 role="dialog" 仍在 DOM 中。因此关闭态的「不渲染」断言
 * 改为「isPanelMounted=false 时不渲染」（open 初始 false 场景）。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\drawer\YdDrawer.test.ts
 * @author ydsz-team
 * @since 5.7.0
 */
import { mount } from '@vue/test-utils';

import { afterEach, describe, expect, it } from 'vitest';

import YdDrawer from './YdDrawer.vue';

import type { YdDrawerProps } from './types';

/** afterEach 清理以免跨用例残留文档碎片与滚动锁 */
afterEach(() => {
  document.body.innerHTML = '';
  document.body.style.overflow = '';
});

/**
 * 创建 YdDrawer 测试包装器。
 *
 * <p>Teleport 桩化后内容留在组件子树，方便断言；
 * transition 不被桩化以避免退场钩子失效。
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

describe('YdDrawer 开关行为', () => {
  it('open=false（初始）时不渲染抽屉', () => {
    const wrapper = mountDrawer({ open: false });
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });

  it('open=true 时渲染 role="dialog" + aria-modal="true"', async () => {
    const wrapper = mountDrawer({ open: false });
    await wrapper.setProps({ open: true });

    const dialog = wrapper.find('[role="dialog"]');
    expect(dialog.exists()).toBe(true);
    expect(dialog.attributes('aria-modal')).toBe('true');
  });

  it('从 open=false 切到 open=true 后应出现抽屉', async () => {
    const wrapper = mountDrawer({ open: false });
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);

    await wrapper.setProps({ open: true });

    const dialog = wrapper.find('[role="dialog"]');
    expect(dialog.exists()).toBe(true);
    expect(dialog.attributes('aria-modal')).toBe('true');
  });
});

describe('YdDrawer 定位', () => {
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
    const wrapper = mountDrawer({ position: 'top', open: false });
    await wrapper.setProps({ open: true });
    const content = wrapper.find('.yd-drawer-content');
    expect(content.classes()).toContain('top-0');
  });

  it('position=bottom 时内容靠底', async () => {
    const wrapper = mountDrawer({ position: 'bottom', open: false });
    await wrapper.setProps({ open: true });
    const content = wrapper.find('.yd-drawer-content');
    expect(content.classes()).toContain('bottom-0');
  });
});

describe('YdDrawer 尺寸', () => {
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

  it('height 传数字时内容区有正确高度样式', async () => {
    const wrapper = mountDrawer({ position: 'top', height: 300, open: false });
    await wrapper.setProps({ open: true });

    const content = wrapper.find('.yd-drawer-content');
    expect(content.attributes('style')).toContain('height: 300px');
  });
});

describe('YdDrawer 关闭行为', () => {
  it('showClose=true 时渲染关闭按钮', async () => {
    const wrapper = mountDrawer({ showClose: true, open: true });
    expect(wrapper.find('.yd-drawer-close').exists()).toBe(true);
  });

  it('showClose=false 时不渲染关闭按钮', async () => {
    const wrapper = mountDrawer({ showClose: false, open: true });
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

  it('maskClosable=true 时点击遮罩触发关闭', async () => {
    const wrapper = mountDrawer({ open: true, maskClosable: true });

    await wrapper.find('.yd-drawer-overlay').trigger('click');

    expect(wrapper.emitted('update:open')).toBeTruthy();
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
});

describe('YdDrawer 插槽', () => {
  it('header 属性显示为标题文本', async () => {
    const wrapper = mountDrawer({ header: '测试抽屉', open: false });
    await wrapper.setProps({ open: true });

    expect(wrapper.find('.yd-drawer-header-title').text()).toBe('测试抽屉');
  });

  it('默认插槽渲染主体内容', async () => {
    const wrapper = mount(YdDrawer, {
      props: { open: true },
      slots: {
        default: '<p data-testid="drawer-body">主要内容</p>',
      },
      global: {
        stubs: { teleport: true },
      },
    });

    expect(wrapper.find('[data-testid="drawer-body"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="drawer-body"]').text()).toBe('主要内容');
    wrapper.unmount();
  });

  it('footer 插槽渲染在底部区域', async () => {
    const wrapper = mount(YdDrawer, {
      props: { open: true },
      slots: {
        footer: '<button class="yd-drawer-footer-btn">确认</button>',
      },
      global: {
        stubs: { teleport: true },
      },
    });

    expect(wrapper.find('.yd-drawer-footer').exists()).toBe(true);
    expect(wrapper.find('.yd-drawer-footer-btn').text()).toBe('确认');
    wrapper.unmount();
  });

  it('header 插槽覆盖 header prop', async () => {
    const wrapper = mount(YdDrawer, {
      props: { header: 'prop header', open: true },
      slots: {
        header: '<span data-testid="custom-header">slot header</span>',
      },
      global: {
        stubs: { teleport: true },
      },
    });

    expect(wrapper.find('[data-testid="custom-header"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="custom-header"]').text()).toBe('slot header');
    wrapper.unmount();
  });
});

describe('YdDrawer ARIA', () => {
  it('aria-label 使用 header 文本', async () => {
    const wrapper = mountDrawer({ header: '我的抽屉', open: true });
    expect(wrapper.find('[role="dialog"]').attributes('aria-label')).toBe('我的抽屉');
  });
});
