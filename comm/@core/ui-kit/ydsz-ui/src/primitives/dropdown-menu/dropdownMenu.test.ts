/**
 * YdDropdownMenu 组件测试 —— 验证导出与关键 props。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\dropdown-menu\dropdownMenu.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { describe, it, expect } from 'vitest';

import YdDropdownMenu from './YdDropdownMenu.vue';
import YdDropdownMenuCheckboxItem from './YdDropdownMenuCheckboxItem.vue';
import YdDropdownMenuContent from './YdDropdownMenuContent.vue';
import YdDropdownMenuGroup from './YdDropdownMenuGroup.vue';
import YdDropdownMenuItem from './YdDropdownMenuItem.vue';
import YdDropdownMenuLabel from './YdDropdownMenuLabel.vue';
import YdDropdownMenuRadioGroup from './YdDropdownMenuRadioGroup.vue';
import YdDropdownMenuRadioItem from './YdDropdownMenuRadioItem.vue';
import YdDropdownMenuSeparator from './YdDropdownMenuSeparator.vue';
import YdDropdownMenuShortcut from './YdDropdownMenuShortcut.vue';
import YdDropdownMenuSub from './YdDropdownMenuSub.vue';
import YdDropdownMenuSubContent from './YdDropdownMenuSubContent.vue';
import YdDropdownMenuSubTrigger from './YdDropdownMenuSubTrigger.vue';
import YdDropdownMenuTrigger from './YdDropdownMenuTrigger.vue';

describe('YdDropdownMenu compound components', () => {
  it('YdDropdownMenu 应被定义', () => {
    expect(YdDropdownMenu).toBeDefined();
  });

  it('YdDropdownMenuContent 应被定义', () => {
    expect(YdDropdownMenuContent).toBeDefined();
  });

  it('YdDropdownMenuItem 应被定义', () => {
    expect(YdDropdownMenuItem).toBeDefined();
  });

  it('YdDropdownMenuTrigger 应被定义', () => {
    expect(YdDropdownMenuTrigger).toBeDefined();
  });

  it('YdDropdownMenuLabel 应被定义', () => {
    expect(YdDropdownMenuLabel).toBeDefined();
  });

  it('YdDropdownMenuSeparator 应被定义', () => {
    expect(YdDropdownMenuSeparator).toBeDefined();
  });

  it('YdDropdownMenuGroup 应被定义', () => {
    expect(YdDropdownMenuGroup).toBeDefined();
  });

  it('YdDropdownMenuRadioGroup 应被定义', () => {
    expect(YdDropdownMenuRadioGroup).toBeDefined();
  });

  it('YdDropdownMenuRadioItem 应被定义', () => {
    expect(YdDropdownMenuRadioItem).toBeDefined();
  });

  it('YdDropdownMenuCheckboxItem 应被定义', () => {
    expect(YdDropdownMenuCheckboxItem).toBeDefined();
  });

  it('YdDropdownMenuSub 应被定义', () => {
    expect(YdDropdownMenuSub).toBeDefined();
  });

  it('YdDropdownMenuSubTrigger 应被定义', () => {
    expect(YdDropdownMenuSubTrigger).toBeDefined();
  });

  it('YdDropdownMenuSubContent 应被定义', () => {
    expect(YdDropdownMenuSubContent).toBeDefined();
  });

  it('YdDropdownMenuShortcut 应被定义', () => {
    expect(YdDropdownMenuShortcut).toBeDefined();
  });
});

describe('YdDropdownMenuItem props', () => {
  it('应包含 class prop', () => {
    expect(YdDropdownMenuItem.props).toHaveProperty('class');
  });

  it('应包含 inset prop', () => {
    expect(YdDropdownMenuItem.props).toHaveProperty('inset');
  });
});

describe('YdDropdownMenuContent props', () => {
  it('应包含 class prop', () => {
    expect(YdDropdownMenuContent.props).toHaveProperty('class');
  });

  it('应包含 sideOffset prop', () => {
    expect(YdDropdownMenuContent.props).toHaveProperty('sideOffset');
  });

  it('sideOffset 默认值应为 4', () => {
    const sideOffsetProp = YdDropdownMenuContent.props.sideOffset;
    expect(sideOffsetProp.default).toBe(4);
  });
});

describe('YdDropdownMenuLabel props', () => {
  it('应包含 inset prop', () => {
    expect(YdDropdownMenuLabel.props).toHaveProperty('inset');
  });
});

describe('YdDropdownMenuShortcut props', () => {
  it('应包含 class prop', () => {
    expect(YdDropdownMenuShortcut.props).toHaveProperty('class');
  });
});
