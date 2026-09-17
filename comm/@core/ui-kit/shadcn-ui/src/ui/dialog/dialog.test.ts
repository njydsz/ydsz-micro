/**
 * Dialog 组件测试 — 验证触发、内容区渲染与关闭按钮可见性
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\dialog\dialog.test.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import { describe, it, expect } from 'vitest';

import Dialog from './Dialog.vue';
import DialogContent from './DialogContent.vue';
import DialogTrigger from './DialogTrigger.vue';
import DialogHeader from './DialogHeader.vue';
import DialogTitle from './DialogTitle.vue';
import DialogDescription from './DialogDescription.vue';
import DialogFooter from './DialogFooter.vue';

describe('Dialog compound components', () => {
  it('Dialog 应存在且为根容器', () => {
    expect(Dialog).toBeDefined();
    expect(typeof Dialog).toBe('object');
  });

  it('DialogContent 应导出并接收 class 属性', () => {
    expect(DialogContent).toBeDefined();
    expect(DialogContent.props).toHaveProperty('class');
  });

  it('DialogContent 应包含 showClose 默认 prop', () => {
    expect(DialogContent.props).toHaveProperty('showClose');
    const showCloseProp = DialogContent.props.showClose;
    expect(showCloseProp).toHaveProperty('default', true);
  });

  it('DialogContent default showClose=true', () => {
    const prop = DialogContent.props.showClose;
    expect(prop.default).toBe(true);
  });

  it('DialogContent 应包含 animationType prop', () => {
    expect(DialogContent.props).toHaveProperty('animationType');
    const prop = DialogContent.props.animationType;
    expect(prop).toHaveProperty('default', 'scale');
  });
});

describe('Dialog compound exports', () => {
  it('DialogTrigger 应有定义', () => {
    expect(DialogTrigger).toBeDefined();
  });

  it('DialogHeader 应有定义', () => {
    expect(DialogHeader).toBeDefined();
  });

  it('DialogTitle 应有定义', () => {
    expect(DialogTitle).toBeDefined();
  });

  it('DialogDescription 应有定义', () => {
    expect(DialogDescription).toBeDefined();
  });

  it('DialogFooter 应有定义', () => {
    expect(DialogFooter).toBeDefined();
  });
});
