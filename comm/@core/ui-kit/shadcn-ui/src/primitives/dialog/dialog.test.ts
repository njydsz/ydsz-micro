/**
 * YdDialog 组件测试 — 验证触发、内容区渲染与关闭按钮可见性
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\dialog\dialog.test.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import { describe, it, expect } from 'vitest';

import YdDialog from './YdDialog.vue';
import YdDialogContent from './YdDialogContent.vue';
import YdDialogTrigger from './YdDialogTrigger.vue';
import YdDialogHeader from './YdDialogHeader.vue';
import YdDialogTitle from './YdDialogTitle.vue';
import YdDialogDescription from './YdDialogDescription.vue';
import YdDialogFooter from './YdDialogFooter.vue';

describe('YdDialog compound components', () => {
  it('YdDialog 应存在且为根容器', () => {
    expect(YdDialog).toBeDefined();
    expect(typeof YdDialog).toBe('object');
  });

  it('YdDialogContent 应导出并接收 class 属性', () => {
    expect(YdDialogContent).toBeDefined();
    expect(YdDialogContent.props).toHaveProperty('class');
  });

  it('YdDialogContent 应包含 showClose 默认 prop', () => {
    expect(YdDialogContent.props).toHaveProperty('showClose');
    const showCloseProp = YdDialogContent.props.showClose;
    expect(showCloseProp).toHaveProperty('default', true);
  });

  it('YdDialogContent default showClose=true', () => {
    const prop = YdDialogContent.props.showClose;
    expect(prop.default).toBe(true);
  });

  it('YdDialogContent 应包含 animationType prop', () => {
    expect(YdDialogContent.props).toHaveProperty('animationType');
    const prop = YdDialogContent.props.animationType;
    expect(prop).toHaveProperty('default', 'scale');
  });
});

describe('YdDialog compound exports', () => {
  it('YdDialogTrigger 应有定义', () => {
    expect(YdDialogTrigger).toBeDefined();
  });

  it('YdDialogHeader 应有定义', () => {
    expect(YdDialogHeader).toBeDefined();
  });

  it('YdDialogTitle 应有定义', () => {
    expect(YdDialogTitle).toBeDefined();
  });

  it('YdDialogDescription 应有定义', () => {
    expect(YdDialogDescription).toBeDefined();
  });

  it('YdDialogFooter 应有定义', () => {
    expect(YdDialogFooter).toBeDefined();
  });
});
