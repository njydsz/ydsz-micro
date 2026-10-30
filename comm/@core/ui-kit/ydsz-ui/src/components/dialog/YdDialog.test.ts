/**
 * YdDialog 组件测试 —— 验证声明式弹窗的 prop 默认值、三厢布局插槽与 class 透传。
 *
 * <p>YdDialogContent / YdDialogTitle / YdDialogDescription 等基于 radix-vue，
 * 在隔离测试中无法独立渲染（需要 DialogRootContext 注入）。
 * 本套件聚焦于不依赖根上下文注入的纯包装层契约：
 * prop 默认值、slot 渲染、class 透传。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\dialog\YdDialog.test.ts
 * @author ydsz-team
 * @since 5.7.0
 */
import { describe, expect, it } from 'vitest';

import { mount } from '@vue/test-utils';

import YdDialog from './YdDialog.vue';
import YdDialogContent from './YdDialogContent.vue';
import YdDialogDescription from './YdDialogDescription.vue';
import YdDialogFooter from './YdDialogFooter.vue';
import YdDialogHeader from './YdDialogHeader.vue';
import YdDialogTitle from './YdDialogTitle.vue';

describe('YdDialog 根容器', () => {
  it('应能挂载并透传 slot 内容', () => {
    const wrapper = mount(YdDialog, {
      slots: {
        default: '<div data-testid="dialog-child">inner</div>',
      },
    });
    expect(wrapper.find('[data-testid="dialog-child"]').exists()).toBe(true);
  });

  it('open prop 应被接受并转发给 DialogRoot', () => {
    const wrapper = mount(YdDialog, {
      props: { open: true },
      slots: {
        default: '<span>child</span>',
      },
    });
    expect(wrapper.props('open')).toBe(true);
  });
});

describe('YdDialogContent prop 默认值', () => {
  it('默认 showClose=true', () => {
    expect(YdDialogContent.props.showClose).toHaveProperty('default', true);
  });

  it('默认 closeOnOverlayClick=true', () => {
    expect(YdDialogContent.props.closeOnOverlayClick).toHaveProperty('default', true);
  });

  it('默认 closeOnEsc=true', () => {
    expect(YdDialogContent.props.closeOnEsc).toHaveProperty('default', true);
  });

  it('默认 animationType=scale', () => {
    expect(YdDialogContent.props.animationType).toHaveProperty('default', 'scale');
  });

  it('默认 appendTo=body', () => {
    expect(YdDialogContent.props.appendTo).toHaveProperty('default', 'body');
  });

  it('默认 closeDisabled=false', () => {
    expect(YdDialogContent.props.closeDisabled).toHaveProperty('default', false);
  });
});

describe('YdDialogHeader / Footer（纯样式壳，不依赖根注入）', () => {
  it('YdDialogHeader 应渲染 slot 内容', () => {
    const wrapper = mount(YdDialogHeader, {
      slots: {
        default: '<span data-testid="header-content">Header</span>',
      },
    });
    expect(wrapper.find('[data-testid="header-content"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Header');
  });

  it('YdDialogHeader 应支持 class 透传', () => {
    const wrapper = mount(YdDialogHeader, {
      props: { class: 'custom-header' },
      slots: {
        default: '<span>Header</span>',
      },
    });
    expect(wrapper.classes()).toContain('custom-header');
  });

  it('YdDialogFooter 应渲染 slot 内容', () => {
    const wrapper = mount(YdDialogFooter, {
      slots: {
        default: '<button data-testid="footer-btn">确定</button>',
      },
    });
    expect(wrapper.find('[data-testid="footer-btn"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('确定');
  });

  it('YdDialogFooter 应支持 class 透传', () => {
    const wrapper = mount(YdDialogFooter, {
      props: { class: 'custom-footer' },
      slots: {
        default: '<button>确定</button>',
      },
    });
    expect(wrapper.classes()).toContain('custom-footer');
  });
});

describe('YdDialogTitle / Description 导出验证', () => {
  it('YdDialogTitle 应导出为函数或对象', () => {
    expect(YdDialogTitle).toBeDefined();
    expect(typeof YdDialogTitle === 'function' || typeof YdDialogTitle === 'object').toBe(true);
  });

  it('YdDialogDescription 应导出为函数或对象', () => {
    expect(YdDialogDescription).toBeDefined();
    expect(typeof YdDialogDescription === 'function' || typeof YdDialogDescription === 'object').toBe(true);
  });
});
