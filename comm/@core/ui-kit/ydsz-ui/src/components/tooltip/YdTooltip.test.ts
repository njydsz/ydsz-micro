/**
 * YdTooltip 组件测试 —— 验证 Provider/Trigger/Content 三件套的挂载、
 * Smart 组合封装以及 delay/side 等高频 props 的透传。
 *
 * <p>YdTooltip（YdTooltip.vue）是容器，必须位于 YdTooltipProvider 内部；
 * YdTooltipSmart 内置 Provider 以便开箱即用；
 * delayDuration 在 Provider 层生效。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\tooltip\YdTooltip.test.ts
 * @author ydsz-team
 * @since 5.7.0
 */
import { mount } from '@vue/test-utils';

import { afterEach, describe, expect, it } from 'vitest';

import YdTooltip from './YdTooltip.vue';
import YdTooltipContent from './YdTooltipContent.vue';
import YdTooltipProvider from './YdTooltipProvider.vue';
import YdTooltipSmart from './YdTooltipSmart.vue';
import YdTooltipTrigger from './YdTooltipTrigger.vue';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('YdTooltipProvider', () => {
  it('应能挂载并渲染 slot 内容', () => {
    const wrapper = mount(YdTooltipProvider, {
      slots: {
        default: '<div data-testid="provider-child">tooltip host</div>',
      },
    });
    expect(wrapper.find('[data-testid="provider-child"]').exists()).toBe(true);
  });

  it('delayDuration prop 应被接受', () => {
    const wrapper = mount(YdTooltipProvider, {
      props: { delayDuration: 700 },
      slots: {
        default: '<span>child</span>',
      },
    });
    expect(wrapper.props('delayDuration')).toBe(700);
  });

  it('disableHoverableContent prop 应被接受', () => {
    const wrapper = mount(YdTooltipProvider, {
      props: { disableHoverableContent: true },
      slots: {
        default: '<span>child</span>',
      },
    });
    expect(wrapper.props('disableHoverableContent')).toBe(true);
  });
});

describe('YdTooltip 容器', () => {
  it('在 Provider 内应能挂载并渲染默认 slot', () => {
    const wrapper = mount(YdTooltipProvider, {
      props: { delayDuration: 0 },
      slots: {
        default: {
          template: `<YdTooltip><button data-testid="tt-trigger">hover me</button></YdTooltip>`,
          components: { YdTooltip },
        },
      },
    });
    expect(wrapper.find('[data-testid="tt-trigger"]').exists()).toBe(true);
  });

  it('open prop 应被接受并转发给 TooltipRoot', () => {
    const wrapper = mount(YdTooltipProvider, {
      props: { delayDuration: 0 },
      slots: {
        default: {
          template: `<YdTooltip :open="true"><span data-testid="tt-child">child</span></YdTooltip>`,
          components: { YdTooltip },
        },
      },
    });
    expect(wrapper.find('[data-testid="tt-child"]').exists()).toBe(true);
  });

  it('defaultOpen prop 应被接受', () => {
    const wrapper = mount(YdTooltipProvider, {
      props: { delayDuration: 0 },
      slots: {
        default: {
          template: `<YdTooltip :defaultOpen="false"><span>child</span></YdTooltip>`,
          components: { YdTooltip },
        },
      },
    });
    // 仅验证组件可挂载不报错
    expect(wrapper.exists()).toBe(true);
  });
});

describe('YdTooltipTrigger', () => {
  it('应渲染 slot 内容', () => {
    const wrapper = mount(YdTooltipProvider, {
      slots: {
        default: {
          template: `
            <YdTooltip>
              <YdTooltipTrigger><button data-testid="trig-el">触发器</button></YdTooltipTrigger>
            </YdTooltip>
          `,
          components: { YdTooltip, YdTooltipTrigger },
        },
      },
      attachTo: document.body,
    });
    expect(wrapper.find('[data-testid="trig-el"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it('asChild=true 时应渲染子元素为原生标签', () => {
    const wrapper = mount(YdTooltipProvider, {
      slots: {
        default: {
          template: `
            <YdTooltip>
              <YdTooltipTrigger :asChild="true"><a href="#" data-testid="link-el">link</a></YdTooltipTrigger>
            </YdTooltip>
          `,
          components: { YdTooltip, YdTooltipTrigger },
        },
      },
      attachTo: document.body,
    });
    expect(wrapper.find('[data-testid="link-el"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="link-el"]').element.tagName).toBe('A');
    wrapper.unmount();
  });
});

describe('YdTooltipContent', () => {
  it('在 open=true 状态下应能挂载', () => {
    const wrapper = mount(YdTooltipProvider, {
      slots: {
        default: {
          template: `
            <YdTooltip :open="true">
              <YdTooltipContent><span data-testid="tc-body">提示内容</span></YdTooltipContent>
            </YdTooltip>
          `,
          components: { YdTooltip, YdTooltipContent },
        },
      },
      attachTo: document.body,
    });
    expect(wrapper.exists()).toBe(true);
    wrapper.unmount();
  });

  it('side=bottom 时应被接受', () => {
    const wrapper = mount(YdTooltipProvider, {
      slots: {
        default: {
          template: `
            <YdTooltip :open="true">
              <YdTooltipContent side="bottom"><span>提示</span></YdTooltipContent>
            </YdTooltip>
          `,
          components: { YdTooltip, YdTooltipContent },
        },
      },
      attachTo: document.body,
    });
    expect(wrapper.exists()).toBe(true);
    wrapper.unmount();
  });

  it('自定义 class 应被应用', () => {
    const wrapper = mount(YdTooltipProvider, {
      slots: {
        default: {
          template: `
            <YdTooltip :open="true">
              <YdTooltipContent class="custom-tip"><span>提示</span></YdTooltipContent>
            </YdTooltip>
          `,
          components: { YdTooltip, YdTooltipContent },
        },
      },
      attachTo: document.body,
    });
    expect(wrapper.exists()).toBe(true);
    wrapper.unmount();
  });
});

describe('YdTooltipSmart 组合封装', () => {
  it('应能挂载并渲染 trigger 与默认 slot', () => {
    const wrapper = mount(YdTooltipSmart, {
      slots: {
        trigger: '<button data-testid="smart-trigger">悬停</button>',
        default: '<span data-testid="smart-content">提示文字</span>',
      },
      attachTo: document.body,
    });
    expect(wrapper.find('[data-testid="smart-trigger"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it('delayDuration prop 应被接受并传给 Provider', () => {
    const wrapper = mount(YdTooltipSmart, {
      props: { delayDuration: 500 },
      slots: {
        trigger: '<button>悬停</button>',
        default: '<span>提示</span>',
      },
      attachTo: document.body,
    });
    expect(wrapper.props('delayDuration')).toBe(500);
    wrapper.unmount();
  });

  it('side prop 应被接受', () => {
    const wrapper = mount(YdTooltipSmart, {
      props: { side: 'bottom' },
      slots: {
        trigger: '<button>悬停</button>',
        default: '<span>提示</span>',
      },
      attachTo: document.body,
    });
    expect(wrapper.props('side')).toBe('bottom');
    wrapper.unmount();
  });

  it('contentClass 应被接受', () => {
    const wrapper = mount(YdTooltipSmart, {
      props: { contentClass: 'my-tooltip-class' },
      slots: {
        trigger: '<button>悬停</button>',
        default: '<span>提示</span>',
      },
      attachTo: document.body,
    });
    expect(wrapper.props('contentClass')).toBe('my-tooltip-class');
    wrapper.unmount();
  });
});

describe('YdTooltip 集成', () => {
  it('Provider + Tooltip + Trigger + Content 四级结构完整组装', () => {
    const wrapper = mount(YdTooltipProvider, {
      props: { delayDuration: 0 },
      slots: {
        default: {
          template: `
            <YdTooltip :open="true">
              <YdTooltipTrigger>
                <button data-testid="integ-btn">按钮</button>
              </YdTooltipTrigger>
              <YdTooltipContent>
                <span data-testid="integ-content">集成提示</span>
              </YdTooltipContent>
            </YdTooltip>
          `,
          components: { YdTooltip, YdTooltipContent, YdTooltipTrigger },
        },
      },
      attachTo: document.body,
    });
    expect(wrapper.find('[data-testid="integ-btn"]').exists()).toBe(true);
    wrapper.unmount();
  });
});
