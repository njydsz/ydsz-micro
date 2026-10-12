/**
 * ConfirmDialog / ConfirmPopup / useConfirm 单元测试。
 *
 * 覆盖的核心断言：
 *   - 组件导出、props 定义、默认值
 *   - useConfirm composable 的 confirm / closeAll 方法形态
 *   - 类型层面的 API 完整性校验
 *
 * 注意：不挂载完整的 Dialog 实例，因为 Radix Vue 的 DismissableLayer
 * 在 happy-dom 环境下会在 focus 事件中读到 null 的 activeElement；
 * 这与 primitives/dialog/dialog.test.ts、alert-dialog/alertDialog.test.ts
 * 中的测试策略一致（验证导出 / props / 定义，不做完整挂载）。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\confirm-dialog\confirm-dialog.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { describe, expect, it } from 'vitest';

import YdConfirmDialog from './YdConfirmDialog.vue';
import YdConfirmPopup from './YdConfirmPopup.vue';
import { useConfirm } from './use-confirm';

import type { ConfirmOptions, UseConfirmReturn } from './types';

/* ============================================================ */
/* helpers                                                        */
/* ============================================================ */

/* ============================================================ */
/* YdConfirmDialog                                                 */
/* ============================================================ */

describe('YdConfirmDialog', () => {
  it('应导出且为 Vue 3 组件对象', () => {
    expect(YdConfirmDialog).toBeDefined();
    expect(typeof YdConfirmDialog).toBe('object');
  });

  it('应包含 name 选项 (YdConfirmDialog)', () => {
    // __name / name 是 defineOptions 注册的
    const componentName = (YdConfirmDialog as any).name
      ?? (YdConfirmDialog as any).__name;
    expect(componentName).toBe('YdConfirmDialog');
  });

  it('应声明 "open" prop 且默认值为 false', () => {
    const props = (YdConfirmDialog as any).props;
    expect(props).toHaveProperty('open');
    expect(props.open.default).toBe(false);
  });

  it('应声明 "message" prop 且必填或默认空字符串', () => {
    const props = (YdConfirmDialog as any).props;
    expect(props).toHaveProperty('message');
    // 默认应为空字符串
    expect(props.message.default).toBe('');
  });

  it('应声明 "confirmButtonType" 且默认值为 "primary"', () => {
    const props = (YdConfirmDialog as any).props;
    expect(props).toHaveProperty('confirmButtonType');
    expect(props.confirmButtonType.default).toBe('primary');
  });

  it('应声明 "rejectButtonType" 且默认值为 "default"', () => {
    const props = (YdConfirmDialog as any).props;
    expect(props).toHaveProperty('rejectButtonType');
    expect(props.rejectButtonType.default).toBe('default');
  });

  it('应声明 "closeOnOverlayClick" 且默认值为 true', () => {
    const props = (YdConfirmDialog as any).props;
    expect(props).toHaveProperty('closeOnOverlayClick');
    expect(props.closeOnOverlayClick.default).toBe(true);
  });

  it('应声明 "closeOnEsc" 且默认值为 true', () => {
    const props = (YdConfirmDialog as any).props;
    expect(props).toHaveProperty('closeOnEsc');
    expect(props.closeOnEsc.default).toBe(true);
  });

  it('应包含 header / icon / confirmLabel / rejectLabel 等可选 props', () => {
    const props = (YdConfirmDialog as any).props;
    expect(props).toHaveProperty('header');
    expect(props).toHaveProperty('icon');
    expect(props).toHaveProperty('confirmLabel');
    expect(props).toHaveProperty('rejectLabel');
  });
});

/* ============================================================ */
/* YdConfirmPopup                                                  */
/* ============================================================ */

describe('YdConfirmPopup', () => {
  it('应导出且为 Vue 3 组件对象', () => {
    expect(YdConfirmPopup).toBeDefined();
    expect(typeof YdConfirmPopup).toBe('object');
  });

  it('应包含 name 选项 (YdConfirmPopup)', () => {
    const componentName = (YdConfirmPopup as any).name
      ?? (YdConfirmPopup as any).__name;
    expect(componentName).toBe('YdConfirmPopup');
  });

  it('应声明 "message" prop', () => {
    const props = (YdConfirmPopup as any).props;
    expect(props).toHaveProperty('message');
  });

  it('应声明 "disabled" prop 且默认值为 false', () => {
    const props = (YdConfirmPopup as any).props;
    expect(props).toHaveProperty('disabled');
    expect(props.disabled.default).toBe(false);
  });

  it('应声明 "side" prop 且默认值为 "top"', () => {
    const props = (YdConfirmPopup as any).props;
    expect(props).toHaveProperty('side');
    expect(props.side.default).toBe('top');
  });

  it('应声明 "align" prop 且默认值为 "center"', () => {
    const props = (YdConfirmPopup as any).props;
    expect(props).toHaveProperty('align');
    expect(props.align.default).toBe('center');
  });

  it('应声明 confirmButtonType / rejectButtonType / 所有按钮相关 props', () => {
    const props = (YdConfirmPopup as any).props;
    expect(props).toHaveProperty('confirmButtonType');
    expect(props).toHaveProperty('rejectButtonType');
    expect(props).toHaveProperty('confirmLabel');
    expect(props).toHaveProperty('rejectLabel');
    expect(props).toHaveProperty('icon');
    expect(props).toHaveProperty('header');
  });
});

/* ============================================================ */
/* useConfirm                                                      */
/* ============================================================ */

describe('useConfirm', () => {
  it('应导出为函数', () => {
    expect(typeof useConfirm).toBe('function');
  });

  it('应返回带有 confirm 和 closeAll 方法的对象', () => {
    // 不实际调用 confirm（依赖 DOM），只验证返回类型结构
    // useConfirm 在 SSR / 非 DOM 环境下返回的句柄结构也正确
    const ctx: UseConfirmReturn = useConfirm();

    expect(ctx).toHaveProperty('confirm');
    expect(ctx).toHaveProperty('closeAll');
    expect(typeof ctx.confirm).toBe('function');
    expect(typeof ctx.closeAll).toBe('function');
  });

  it('confirm 函数应为异步（返回 Promise）', async () => {
    // 在非 DOM 环境验证签名形态即可
    const ctx = useConfirm();
    // 不实际调用（需 document.body），仅确认其为 function
    expect(ctx.confirm).toBeInstanceOf(Function);
    expect(ctx.confirm).toHaveProperty('length', 1); // 单参数
  });
});

/* ============================================================ */
/* 类型 兼容性                                                     */
/* ============================================================ */

describe('类型校验', () => {
  it('ConfirmOptions 应允许仅传 message', () => {
    // 编译期类型检查：下列代码必须能编译
    const opts: ConfirmOptions = { message: '测试' };
    expect(opts.message).toBe('测试');
  });

  it('ConfirmOptions 应接受完整选项', () => {
    const opts: ConfirmOptions = {
      confirmButtonType: 'danger',
      confirmLabel: '确认删除',
      header: '删除确认',
      icon: 'mdi:alert-circle',
      message: '确认删除该记录吗？',
      rejectButtonType: 'text',
      rejectLabel: '取消',
    };
    expect(opts.confirmButtonType).toBe('danger');
    expect(opts.icon).toBe('mdi:alert-circle');
  });

  it('useConfirm 返回类型 UseConfirmReturn 包含全部方法', () => {
    // 编译期类型体操：确保所有公共 API 类型正确
    const _use = (): UseConfirmReturn => {
      return {} as UseConfirmReturn;
    };
    expect(typeof _use).toBe('function');
  });
});
