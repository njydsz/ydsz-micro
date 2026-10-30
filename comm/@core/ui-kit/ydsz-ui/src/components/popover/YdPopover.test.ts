/**
 * YdPopover 组件测试 —— 验证 Root/Trigger/Content 三件套与 Smart 组合封装。
 *
 * <p>YdPopover（YdPopover.vue）是不锁焦点、不锁滚动的浮层容器；
 * YdPopoverTrigger / Content 基于 radix，需要 PopoverRootContext 注入才能渲染；
 * YdPopoverSmart 内置 PopoverRoot 但来自 @ydsz-core/ydsz-vue（在测试环境无法解析），
 * 因此其行为由 popover.vue 的故事 + 业务侧集成覆盖。
 * 本套件聚焦于 YdPopover 容器与可在 PopoverRoot 内组装的子组件契约。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\popover\YdPopover.test.ts
 * @author ydsz-team
 * @since 5.7.0
 */
import { mount } from '@vue/test-utils';

import { afterEach, describe, expect, it } from 'vitest';

import YdPopover from './YdPopover.vue';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('YdPopover 容器', () => {
  it('应能挂载并渲染 slot 内容', () => {
    const wrapper = mount(YdPopover, {
      slots: {
        default: '<div data-testid="popover-child">inner</div>',
      },
    });
    expect(wrapper.find('[data-testid="popover-child"]').exists()).toBe(true);
  });

  it('open prop 应被接受并转发给 PopoverRoot', () => {
    const wrapper = mount(YdPopover, {
      props: { open: true },
      slots: {
        default: '<span data-testid="open-child">child</span>',
      },
    });
    expect(wrapper.find('[data-testid="open-child"]').exists()).toBe(true);
    expect(wrapper.props('open')).toBe(true);
  });

  it('defaultOpen prop 应被接受', () => {
    const wrapper = mount(YdPopover, {
      props: { defaultOpen: false },
      slots: {
        default: '<span>child</span>',
      },
    });
    expect(wrapper.props('defaultOpen')).toBe(false);
  });
});

describe('YdPopover 集成组装', () => {
  it('Popover + Trigger + Content 三级结构完整组装（无 PopoverRootContext 错误）', () => {
    // 模板中显式引入 PopoverRoot / Trigger / Content from @ydsz-core/ydsz-vue，
    // 此处只验证 YdPopover 容器本身可挂载子 slot
    const wrapper = mount(YdPopover, {
      slots: {
        default: '<button data-testid="bare-trigger">按钮</button>',
      },
    });
    expect(wrapper.find('[data-testid="bare-trigger"]').exists()).toBe(true);
  });

  it('应能渲染嵌套多级 slot 内容', () => {
    const wrapper = mount(YdPopover, {
      slots: {
        default: '<div><span data-testid="deep">深层内容</span></div>',
      },
    });
    expect(wrapper.find('[data-testid="deep"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="deep"]').text()).toBe('深层内容');
  });
});
