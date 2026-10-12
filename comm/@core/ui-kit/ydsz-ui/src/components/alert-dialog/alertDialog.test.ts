/**
 * YdAlertDialog 组件测试 —— 验证导出。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\alert-dialog\alertDialog.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { describe, it, expect } from 'vitest';

import YdAlertDialog from './YdAlertDialog.vue';
import YdAlertDialogAction from './YdAlertDialogAction.vue';
import YdAlertDialogCancel from './YdAlertDialogCancel.vue';
import YdAlertDialogContent from './YdAlertDialogContent.vue';
import YdAlertDialogDescription from './YdAlertDialogDescription.vue';
import YdAlertDialogTitle from './YdAlertDialogTitle.vue';
import YdAlertDialogTrigger from './YdAlertDialogTrigger.vue';
describe('YdAlertDialog compound components', () => {
  it('YdAlertDialog 应被定义', () => {
    expect(YdAlertDialog).toBeDefined();
  });

  it('YdAlertDialogContent 应被定义', () => {
    expect(YdAlertDialogContent).toBeDefined();
  });

  it('YdAlertDialogTitle 应被定义', () => {
    expect(YdAlertDialogTitle).toBeDefined();
  });

  it('YdAlertDialogDescription 应被定义', () => {
    expect(YdAlertDialogDescription).toBeDefined();
  });

  it('YdAlertDialogAction 应被定义', () => {
    expect(YdAlertDialogAction).toBeDefined();
  });

    it('YdAlertDialogCancel 应被定义', () => {
    expect(YdAlertDialogCancel).toBeDefined();
  });

  it('YdAlertDialogTrigger 应被定义', () => {
    expect(YdAlertDialogTrigger).toBeDefined();
  });
});

describe('YdAlertDialogContent props', () => {
  it('应包含 centered prop', () => {
    expect(YdAlertDialogContent.props).toHaveProperty('centered');
  });

  it('应包含 overlayBlur prop', () => {
    expect(YdAlertDialogContent.props).toHaveProperty('overlayBlur');
  });

  it('应包含 zIndex prop', () => {
    expect(YdAlertDialogContent.props).toHaveProperty('zIndex');
  });

  it('应包含 class prop', () => {
    expect(YdAlertDialogContent.props).toHaveProperty('class');
  });
});
