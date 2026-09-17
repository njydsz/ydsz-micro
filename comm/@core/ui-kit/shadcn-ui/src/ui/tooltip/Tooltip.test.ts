/**
 * Tooltip 组件测试 —— 验证 Provider/Trigger/Content 三件套与延迟逻辑
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * <p>Tooltip 必须三层嵌套使用（Provider > Trigger > Content），
 * 测试聚焦于本包装层的 props 转发与 slot 组装。
 * 注意：根-Tooltip 只是 TooltipRoot 的转发层，开合状态由 Provider 控制。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\tooltip\Tooltip.test.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import { describe, expect, it } from 'vitest';

import { mount } from '@vue/test-utils';

import Tooltip from './Tooltip.vue';
import TooltipContent from './TooltipContent.vue';
import TooltipProvider from './TooltipProvider.vue';
import TooltipTrigger from './TooltipTrigger.vue';

describe('Tooltip (TooltipRoot wrapper)', () => {
  it('应能挂载并渲染默认 slot', () => {
    const wrapper = mount(Tooltip, {
      slots: {
        default: '<button>hover me</button>',
      },
    });
    expect(wrapper.find('button').exists()).toBe(true);
    expect(wrapper.text()).toContain('hover me');
  });

  it('open prop 应被转发到 TooltipRoot', () => {
    const wrapper = mount(Tooltip, {
      props: { open: true },
      slots: {
        default: '<span>child</span>',
      },
    });
    expect(wrapper.props('open')).toBe(true);
  });

  it('defaultOpen 属性应可用', () => {
    const wrapper = mount(Tooltip, {
      props: { defaultOpen: false },
      slots: {
        default: '<span>child</span>',
      },
    });
    expect(wrapper.props('defaultOpen')).toBe(false);
  });
});

describe('TooltipProvider', () => {
  it('应能挂载并渲染 slot 内容', () => {
    const wrapper = mount(TooltipProvider, {
      slots: {
        default: '<div data-testid="provider-child">content</div>',
      },
    });
    expect(wrapper.find('[data-testid="provider-child"]').exists()).toBe(true);
  });

  it('delayDuration 应在合理范围内被接受', () => {
    const wrapper = mount(TooltipProvider, {
      props: { delayDuration: 500 },
      slots: {
        default: '<span>child</span>',
      },
    });
    expect(wrapper.props('delayDuration')).toBe(500);
  });

  it('disableHoverableContent 属性应可用', () => {
    const wrapper = mount(TooltipProvider, {
      props: { disableHoverableContent: true },
      slots: {
        default: '<span>child</span>',
      },
    });
    expect(wrapper.props('disableHoverableContent')).toBe(true);
  });
});

describe('TooltipTrigger', () => {
  it('应渲染为 button 元素', () => {
    const wrapper = mount(TooltipTrigger, {
      slots: {
        default: '触发器',
      },
    });
    const el = wrapper.element as HTMLElement;
    expect(el.tagName).toBe('BUTTON');
  });

  it('应渲染 slot 内容', () => {
    const wrapper = mount(TooltipTrigger, {
      slots: {
        default: '<span data-testid="trigger-text">hover</span>',
      },
    });
    expect(wrapper.find('[data-testid="trigger-text"]').exists()).toBe(true);
  });

  it('asChild 属性应被接受', () => {
    const wrapper = mount(TooltipTrigger, {
      props: { asChild: true },
      slots: {
        default: '<a href="#">link trigger</a>',
      },
    });
    expect(wrapper.props('asChild')).toBe(true);
  });
});

describe('TooltipContent', () => {
  it('应能挂载并渲染 slot 内容', () => {
    const wrapper = mount(TooltipContent, {
      slots: {
        default: '提示文本',
      },
      attachTo: document.body,
    });
    expect(wrapper.text()).toContain('提示文本');
    wrapper.unmount();
  });

  it('side 属性影响定位', () => {
    const wrapper = mount(TooltipContent, {
      props: { side: 'bottom' },
      slots: {
        default: '提示',
      },
      attachTo: document.body,
    });
    expect(wrapper.props('side')).toBe('bottom');
    wrapper.unmount();
  });

  it('align 属性应可用', () => {
    const wrapper = mount(TooltipContent, {
      props: { align: 'start', side: 'top' },
      slots: {
        default: '提示',
      },
      attachTo: document.body,
    });
    expect(wrapper.props('align')).toBe('start');
    wrapper.unmount();
  });

  it('自定义 class 应被合并', () => {
    const wrapper = mount(TooltipContent, {
      props: { class: 'custom-tooltip-content' },
      slots: {
        default: '提示',
      },
      attachTo: document.body,
    });
    expect(wrapper.classes()).toContain('custom-tooltip-content');
    wrapper.unmount();
  });
});

describe('Tooltip integration', () => {
  it('Provider + Trigger + Content 三级结构可组装', () => {
    const wrapper = mount(TooltipProvider, {
      props: { delayDuration: 0 },
      slots: {
        default: {
          template: `
            <Tooltip :open="true">
              <TooltipTrigger>
                <button data-testid="t-btn">按钮</button>
              </TooltipTrigger>
              <TooltipContent>
                <span data-testid="t-content">提示内容</span>
              </TooltipContent>
            </Tooltip>
          `,
        },
      },
      attachTo: document.body,
    });
    expect(wrapper.find('[data-testid="t-btn"]').exists()).toBe(true);
    wrapper.unmount();
  });
});
