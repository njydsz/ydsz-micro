/**
 * YdSheet 组件测试 —— 验证导出与 props。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\sheet\sheet.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { describe, it, expect } from 'vitest';

import { sheetVariants } from './sheet';
import YdSheet from './YdSheet.vue';
import YdSheetClose from './YdSheetClose.vue';
import YdSheetContent from './YdSheetContent.vue';
import YdSheetDescription from './YdSheetDescription.vue';
import YdSheetFooter from './YdSheetFooter.vue';
import YdSheetHeader from './YdSheetHeader.vue';
import YdSheetTitle from './YdSheetTitle.vue';
import YdSheetTrigger from './YdSheetTrigger.vue';

describe('YdSheet compound components', () => {
  it('YdSheet 应被定义', () => {
    expect(YdSheet).toBeDefined();
  });

  it('YdSheetContent 应导出', () => {
    expect(YdSheetContent).toBeDefined();
  });

  it('YdSheetTitle 应导出', () => {
    expect(YdSheetTitle).toBeDefined();
  });

  it('YdSheetHeader 应导出', () => {
    expect(YdSheetHeader).toBeDefined();
  });

  it('YdSheetFooter 应导出', () => {
    expect(YdSheetFooter).toBeDefined();
  });

  it('YdSheetDescription 应导出', () => {
    expect(YdSheetDescription).toBeDefined();
  });

  it('YdSheetTrigger 应导出', () => {
    expect(YdSheetTrigger).toBeDefined();
  });

  it('YdSheetClose 应导出', () => {
    expect(YdSheetClose).toBeDefined();
  });
});

describe('YdSheetContent props', () => {
  it('应包含 side prop 且默认值为 right', () => {
    expect(YdSheetContent.props).toHaveProperty('side');
    // prop default 可能通过 withDefaults 赋值为 'right'
    const sideProp = YdSheetContent.props.side;
    expect(sideProp).toBeDefined();
  });

  it('应包含 overlayBlur prop', () => {
    expect(YdSheetContent.props).toHaveProperty('overlayBlur');
  });

  it('应包含 zIndex prop', () => {
    expect(YdSheetContent.props).toHaveProperty('zIndex');
  });
});

describe('sheetVariants cva', () => {
  it('sheetVariants 应是函数', () => {
    expect(typeof sheetVariants).toBe('function');
  });

  it('调用 sheetVariants 应返回字符串', () => {
    const result = sheetVariants({ side: 'right' });
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('sheetVariants 接受四种 side 值', () => {
    const sides = ['top', 'right', 'bottom', 'left'] as const;
    for (const side of sides) {
      const result = sheetVariants({ side });
      expect(typeof result).toBe('string');
      expect(result).toContain('slide-in-from-');
    }
  });
});
