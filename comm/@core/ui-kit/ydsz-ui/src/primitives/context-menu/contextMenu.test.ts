/**
 * YdContextMenu 组件测试 —— 验证导出。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\context-menu\contextMenu.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { describe, it, expect } from 'vitest';

import YdContextMenu from './YdContextMenu.vue';
import YdContextMenuCheckboxItem from './YdContextMenuCheckboxItem.vue';
import YdContextMenuContent from './YdContextMenuContent.vue';
import YdContextMenuGroup from './YdContextMenuGroup.vue';
import YdContextMenuItem from './YdContextMenuItem.vue';
import YdContextMenuLabel from './YdContextMenuLabel.vue';
import YdContextMenuRadioGroup from './YdContextMenuRadioGroup.vue';
import YdContextMenuRadioItem from './YdContextMenuRadioItem.vue';
import YdContextMenuSeparator from './YdContextMenuSeparator.vue';
import YdContextMenuShortcut from './YdContextMenuShortcut.vue';
import YdContextMenuSub from './YdContextMenuSub.vue';
import YdContextMenuSubContent from './YdContextMenuSubContent.vue';
import YdContextMenuSubTrigger from './YdContextMenuSubTrigger.vue';
import YdContextMenuTrigger from './YdContextMenuTrigger.vue';

describe('YdContextMenu compound components', () => {
  it('YdContextMenu 应被定义', () => {
    expect(YdContextMenu).toBeDefined();
  });

  it('YdContextMenuContent 应被定义', () => {
    expect(YdContextMenuContent).toBeDefined();
  });

  it('YdContextMenuItem 应被定义', () => {
    expect(YdContextMenuItem).toBeDefined();
  });

  it('YdContextMenuTrigger 应被定义', () => {
    expect(YdContextMenuTrigger).toBeDefined();
  });

  it('YdContextMenuLabel 应被定义', () => {
    expect(YdContextMenuLabel).toBeDefined();
  });

  it('YdContextMenuSeparator 应被定义', () => {
    expect(YdContextMenuSeparator).toBeDefined();
  });

  it('YdContextMenuGroup 应被定义', () => {
    expect(YdContextMenuGroup).toBeDefined();
  });

  it('YdContextMenuRadioGroup 应被定义', () => {
    expect(YdContextMenuRadioGroup).toBeDefined();
  });

  it('YdContextMenuRadioItem 应被定义', () => {
    expect(YdContextMenuRadioItem).toBeDefined();
  });

  it('YdContextMenuCheckboxItem 应被定义', () => {
    expect(YdContextMenuCheckboxItem).toBeDefined();
  });

  it('YdContextMenuSub 应被定义', () => {
    expect(YdContextMenuSub).toBeDefined();
  });

  it('YdContextMenuSubTrigger 应被定义', () => {
    expect(YdContextMenuSubTrigger).toBeDefined();
  });

  it('YdContextMenuSubContent 应被定义', () => {
    expect(YdContextMenuSubContent).toBeDefined();
  });

  it('YdContextMenuShortcut 应被定义', () => {
    expect(YdContextMenuShortcut).toBeDefined();
  });
});

describe('YdContextMenuItem props', () => {
  it('应包含 class prop', () => {
    expect(YdContextMenuItem.props).toHaveProperty('class');
  });

  it('应包含 inset prop', () => {
    expect(YdContextMenuItem.props).toHaveProperty('inset');
  });
});

describe('YdContextMenuContent props', () => {
  it('应包含 class prop', () => {
    expect(YdContextMenuContent.props).toHaveProperty('class');
  });
});
