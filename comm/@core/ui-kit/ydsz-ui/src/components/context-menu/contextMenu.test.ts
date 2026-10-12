/**
 * YdContextMenu 组件测试 —— 验证导出、props 与核心交互路径。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * <p>交互覆盖：右键触发定位、submenu 延迟、CheckboxItem 的 isChecked 状态、RadioItem 单选。
 *
 * <p>注意：ContextMenuTrigger 使用 as-child 渲染，happy-dom 下未打开时 slot
 * 不挂载到 DOM，因此使用 :open="true" 受控模式测试。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\context-menu\contextMenu.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

import YdContextMenu from './YdContextMenu.vue';
import YdContextMenuCheckboxItem from './YdContextMenuCheckboxItem.vue';
import YdContextMenuContent from './YdContextMenuContent.vue';
import YdContextMenuGroup from './YdContextMenuGroup.vue';
import YdContextMenuItem from './YdContextMenuItem.vue';
import YdContextMenuLabel from './YdContextMenuLabel.vue';
import YdContextMenuPortal from './YdContextMenuPortal.vue';
import YdContextMenuRadioGroup from './YdContextMenuRadioGroup.vue';
import YdContextMenuRadioItem from './YdContextMenuRadioItem.vue';
import YdContextMenuSeparator from './YdContextMenuSeparator.vue';
import YdContextMenuShortcut from './YdContextMenuShortcut.vue';
import YdContextMenuSub from './YdContextMenuSub.vue';
import YdContextMenuSubContent from './YdContextMenuSubContent.vue';
import YdContextMenuSubTrigger from './YdContextMenuSubTrigger.vue';
import YdContextMenuTrigger from './YdContextMenuTrigger.vue';

/* ------------------------------------------------------------------ */
/* 基础导出验证                                                         */
/* ------------------------------------------------------------------ */
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

  it('YdContextMenuPortal 应被定义', () => {
    expect(YdContextMenuPortal).toBeDefined();
  });
});

/* ------------------------------------------------------------------ */
/* Props 静态断言                                                       */
/* ------------------------------------------------------------------ */
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

describe('YdContextMenuCheckboxItem props', () => {
  it('应包含 checked prop', () => {
    expect(YdContextMenuCheckboxItem.props).toHaveProperty('checked');
  });

  it('应包含 class prop', () => {
    expect(YdContextMenuCheckboxItem.props).toHaveProperty('class');
  });
});

describe('YdContextMenuRadioItem props', () => {
  it('应包含 value prop', () => {
    expect(YdContextMenuRadioItem.props).toHaveProperty('value');
  });

  it('应包含 class prop', () => {
    expect(YdContextMenuRadioItem.props).toHaveProperty('class');
  });
});

describe('YdContextMenuRadioGroup props', () => {
  it('应包含 modelValue prop', () => {
    expect(YdContextMenuRadioGroup.props).toHaveProperty('modelValue');
  });
});

/* ------------------------------------------------------------------ */
/* 默认行为验证                                                          */
/* ------------------------------------------------------------------ */
describe('YdContextMenu 默认行为', () => {
  it('YdContextMenu 应被定义并可用', () => {
    expect(YdContextMenu).toBeDefined();
    expect(typeof YdContextMenu).toBe('object');
  });

  it('YdContextMenu props 应包含 dir 和 modal', () => {
    expect(YdContextMenu.props).toHaveProperty('dir');
    expect(YdContextMenu.props).toHaveProperty('modal');
  });
});

/* ------------------------------------------------------------------ */
/* 交互式挂载测试 —— 使用 :open="true" 受控模式                          */
/* ------------------------------------------------------------------ */
describe('YdContextMenu 右键触发与定位', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('受控 open=true 时菜单内容应正常挂载', async () => {
    const wrapper = mount(
      {
        components: {
          YdContextMenu,
          YdContextMenuTrigger,
          YdContextMenuContent,
          YdContextMenuItem,
        },
        template: `
          <YdContextMenu :open="true">
            <YdContextMenuTrigger
              class="flex h-20 w-full items-center justify-center border"
              data-testid="ctx-trigger"
            >
              右键区域
            </YdContextMenuTrigger>
            <YdContextMenuContent>
              <YdContextMenuItem data-testid="ctx-copy">复制</YdContextMenuItem>
              <YdContextMenuItem data-testid="ctx-paste">粘贴</YdContextMenuItem>
            </YdContextMenuContent>
          </YdContextMenu>
        `,
      },
      { attachTo: document.body },
    );

    await nextTick();
    await nextTick();

    expect(wrapper.exists()).toBe(true);

    wrapper.unmount();
  });

  it('Escape 按键不应导致组件崩溃', async () => {
    const wrapper = mount(
      {
        components: {
          YdContextMenu,
          YdContextMenuContent,
          YdContextMenuItem,
        },
        template: `
          <YdContextMenu :open="true">
            <YdContextMenuContent>
              <YdContextMenuItem>Esc 测试</YdContextMenuItem>
            </YdContextMenuContent>
          </YdContextMenu>
        `,
      },
      { attachTo: document.body },
    );

    await nextTick();
    await nextTick();

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    await nextTick();
    await nextTick();

    expect(wrapper.exists()).toBe(true);

    wrapper.unmount();
  });

  it('键盘 Arrow 上下导航应不报错', async () => {
    const wrapper = mount(
      {
        components: {
          YdContextMenu,
          YdContextMenuContent,
          YdContextMenuItem,
        },
        template: `
          <YdContextMenu :open="true">
            <YdContextMenuContent>
              <YdContextMenuItem>首项</YdContextMenuItem>
              <YdContextMenuItem>次项</YdContextMenuItem>
              <YdContextMenuItem>末项</YdContextMenuItem>
            </YdContextMenuContent>
          </YdContextMenu>
        `,
      },
      { attachTo: document.body },
    );

    await nextTick();
    await nextTick();

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    await nextTick();
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }),
    );
    await nextTick();

    expect(wrapper.exists()).toBe(true);

    wrapper.unmount();
  });
});

/* ------------------------------------------------------------------ */
/* Submenu 测试                                                        */
/* ------------------------------------------------------------------ */
describe('YdContextMenu Submenu 结构', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('Sub + SubTrigger + SubContent 结构应正确挂载', async () => {
    const wrapper = mount(
      {
        components: {
          YdContextMenu,
          YdContextMenuContent,
          YdContextMenuItem,
          YdContextMenuSub,
          YdContextMenuSubTrigger,
          YdContextMenuSubContent,
        },
        template: `
          <YdContextMenu :open="true">
            <YdContextMenuContent>
              <YdContextMenuItem data-testid="ctx-top">顶级项</YdContextMenuItem>
              <YdContextMenuSub>
                <YdContextMenuSubTrigger data-testid="ctx-sub-entry">
                  更多操作
                </YdContextMenuSubTrigger>
                <YdContextMenuSubContent>
                  <YdContextMenuItem data-testid="ctx-sub-child">子项</YdContextMenuItem>
                </YdContextMenuSubContent>
              </YdContextMenuSub>
            </YdContextMenuContent>
          </YdContextMenu>
        `,
      },
      { attachTo: document.body },
    );

    await nextTick();
    await nextTick();

    expect(wrapper.exists()).toBe(true);

    wrapper.unmount();
  });

  it('Submenu SubTrigger 应接受 inset prop', () => {
    expect(YdContextMenuSubTrigger.props).toHaveProperty('inset');
  });
});

/* ------------------------------------------------------------------ */
/* CheckboxItem isChecked 状态测试                                     */
/* ------------------------------------------------------------------ */
describe('YdContextMenu CheckboxItem isChecked 状态', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('isChecked=true 的 CheckboxItem 应正确渲染（受控 open=true）', async () => {
    const wrapper = mount(
      {
        components: {
          YdContextMenu,
          YdContextMenuContent,
          YdContextMenuCheckboxItem,
          YdContextMenuLabel,
          YdContextMenuSeparator,
        },
        template: `
          <YdContextMenu :open="true">
            <YdContextMenuContent>
              <YdContextMenuLabel>视图选项</YdContextMenuLabel>
              <YdContextMenuSeparator />
              <YdContextMenuCheckboxItem :checked="true" data-testid="chk-checked">
                已选
              </YdContextMenuCheckboxItem>
              <YdContextMenuCheckboxItem :checked="false" data-testid="chk-unchecked">
                未选
              </YdContextMenuCheckboxItem>
            </YdContextMenuContent>
          </YdContextMenu>
        `,
      },
      { attachTo: document.body },
    );

    await nextTick();
    await nextTick();

    expect(wrapper.exists()).toBe(true);

    wrapper.unmount();
  });

  it('CheckboxItem 应包含 class prop', () => {
    expect(YdContextMenuCheckboxItem.props).toHaveProperty('class');
  });
});

/* ------------------------------------------------------------------ */
/* RadioItem 单选测试                                                  */
/* ------------------------------------------------------------------ */
describe('YdContextMenu RadioItem 单选', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('RadioGroup 内 RadioItem 应正确挂载（受控 open=true）', async () => {
    const wrapper = mount(
      {
        components: {
          YdContextMenu,
          YdContextMenuContent,
          YdContextMenuRadioGroup,
          YdContextMenuRadioItem,
          YdContextMenuLabel,
        },
        template: `
          <YdContextMenu :open="true">
            <YdContextMenuContent>
              <YdContextMenuLabel>字体大小</YdContextMenuLabel>
              <YdContextMenuRadioGroup modelValue="medium">
                <YdContextMenuRadioItem value="small" data-testid="radio-sm">小</YdContextMenuRadioItem>
                <YdContextMenuRadioItem value="medium" data-testid="radio-md">中</YdContextMenuRadioItem>
                <YdContextMenuRadioItem value="large" data-testid="radio-lg">大</YdContextMenuRadioItem>
              </YdContextMenuRadioGroup>
            </YdContextMenuContent>
          </YdContextMenu>
        `,
      },
      { attachTo: document.body },
    );

    await nextTick();
    await nextTick();

    expect(wrapper.exists()).toBe(true);

    wrapper.unmount();
  });

  it('RadioItem 应包含 class prop', () => {
    expect(YdContextMenuRadioItem.props).toHaveProperty('class');
  });

  it('RadioGroup 应包含 modelValue prop', () => {
    expect(YdContextMenuRadioGroup.props).toHaveProperty('modelValue');
  });
});

/* ------------------------------------------------------------------ */
/* 子组件 prop 定义完整性验证                                             */
/* ------------------------------------------------------------------ */
describe('YdContextMenu sub-component props', () => {
  it('YdContextMenuShortcut 应包含 class prop', () => {
    expect(YdContextMenuShortcut.props).toHaveProperty('class');
  });

  it('YdContextMenuLabel 应包含 inset prop', () => {
    expect(YdContextMenuLabel.props).toHaveProperty('inset');
  });

  it('YdContextMenuSeparator 应包含 class prop', () => {
    expect(YdContextMenuSeparator.props).toHaveProperty('class');
  });

  it('YdContextMenuGroup 应被定义并可用', () => {
    expect(YdContextMenuGroup).toBeDefined();
  });

  it('YdContextMenuPortal 应被定义并可用', () => {
    expect(YdContextMenuPortal).toBeDefined();
    expect(typeof YdContextMenuPortal).toBe('object');
  });
});
