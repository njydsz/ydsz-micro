/**
 * YdContextMenu 组件 Storybook Stories。
 *
 * P0-3: 补齐 stories —— ContextMenu（15 文件，此前零覆盖）。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\context-menu\ContextMenu.stories.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { Meta, StoryObj } from '@storybook/vue3';

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

const meta: Meta<typeof YdContextMenu> = {
  title: 'Primitives/YdContextMenu',
  component: YdContextMenu,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: '右键菜单。支持与 DropdownMenu 类似的复合模式（Submenu / Checkbox / Radio / Group）。',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** 基础右键菜单 */
export const Default: Story = {
  render: () => ({
    components: {
      YdContextMenu,
      YdContextMenuTrigger,
      YdContextMenuContent,
      YdContextMenuItem,
      YdContextMenuLabel,
      YdContextMenuSeparator,
      YdContextMenuShortcut,
    },
    template: `
      <YdContextMenu>
        <YdContextMenuTrigger class="flex h-40 w-full items-center justify-center rounded border border-dashed text-sm">
          右键点击此区域
        </YdContextMenuTrigger>
        <YdContextMenuContent>
          <YdContextMenuLabel>操作</YdContextMenuLabel>
          <YdContextMenuSeparator />
          <YdContextMenuItem>
            复制
            <YdContextMenuShortcut>⌘C</YdContextMenuShortcut>
          </YdContextMenuItem>
          <YdContextMenuItem>
            粘贴
            <YdContextMenuShortcut>⌘V</YdContextMenuShortcut>
          </YdContextMenuItem>
          <YdContextMenuItem inset>
            偏好设置
          </YdContextMenuItem>
        </YdContextMenuContent>
      </YdContextMenu>
    `,
  }),
};

/** 带 Checkbox 项目 */
export const WithCheckbox: Story = {
  render: () => ({
    components: {
      YdContextMenu,
      YdContextMenuTrigger,
      YdContextMenuContent,
      YdContextMenuCheckboxItem,
      YdContextMenuLabel,
      YdContextMenuSeparator,
    },
    template: `
      <YdContextMenu>
        <YdContextMenuTrigger class="flex h-20 w-full items-center justify-center rounded border border-dashed text-sm">
          右键
        </YdContextMenuTrigger>
        <YdContextMenuContent>
          <YdContextMenuLabel>视图选项</YdContextMenuLabel>
          <YdContextMenuSeparator />
          <YdContextMenuCheckboxItem :checked="true">显示行号</YdContextMenuCheckboxItem>
          <YdContextMenuCheckboxItem :checked="false">换行显示</YdContextMenuCheckboxItem>
        </YdContextMenuContent>
      </YdContextMenu>
    `,
  }),
};

/** 带 Radio 组 */
export const WithRadio: Story = {
  render: () => ({
    components: {
      YdContextMenu,
      YdContextMenuTrigger,
      YdContextMenuContent,
      YdContextMenuRadioGroup,
      YdContextMenuRadioItem,
      YdContextMenuLabel,
    },
    template: `
      <YdContextMenu>
        <YdContextMenuTrigger class="flex h-20 w-full items-center justify-center rounded border border-dashed text-sm">
          右键
        </YdContextMenuTrigger>
        <YdContextMenuContent>
          <YdContextMenuLabel>字体大小</YdContextMenuLabel>
          <YdContextMenuRadioGroup value="medium">
            <YdContextMenuRadioItem value="small">小</YdContextMenuRadioItem>
            <YdContextMenuRadioItem value="medium">中</YdContextMenuRadioItem>
            <YdContextMenuRadioItem value="large">大</YdContextMenuRadioItem>
          </YdContextMenuRadioGroup>
        </YdContextMenuContent>
      </YdContextMenu>
    `,
  }),
};

/** 带子菜单 / With Submenu */
export const WithSubmenu: Story = {
  render: () => ({
    components: {
      YdContextMenu,
      YdContextMenuTrigger,
      YdContextMenuContent,
      YdContextMenuItem,
      YdContextMenuSub,
      YdContextMenuSubTrigger,
      YdContextMenuSubContent,
    },
    template: `
      <YdContextMenu>
        <YdContextMenuTrigger class="flex h-20 w-full items-center justify-center rounded border border-dashed text-sm">
          右键 / Right-click
        </YdContextMenuTrigger>
        <YdContextMenuContent>
          <YdContextMenuItem>撤销 / Undo</YdContextMenuItem>
          <YdContextMenuSub>
            <YdContextMenuSubTrigger>分享 / Share</YdContextMenuSubTrigger>
            <YdContextMenuSubContent>
              <YdContextMenuItem>微信 / WeChat</YdContextMenuItem>
              <YdContextMenuItem>钉钉 / DingTalk</YdContextMenuItem>
              <YdContextMenuItem>邮件 / Email</YdContextMenuItem>
            </YdContextMenuSubContent>
          </YdContextMenuSub>
        </YdContextMenuContent>
      </YdContextMenu>
    `,
  }),
};

/** 编辑器右键菜单 / Editor Context Menu */
export const EditorMenu: Story = {
  render: () => ({
    components: {
      YdContextMenu,
      YdContextMenuTrigger,
      YdContextMenuContent,
      YdContextMenuItem,
      YdContextMenuSeparator,
      YdContextMenuShortcut,
      YdContextMenuGroup,
      YdContextMenuLabel,
    },
    template: `
      <YdContextMenu>
        <YdContextMenuTrigger class="flex h-32 w-full items-center justify-center rounded border border-dashed text-sm">
          编辑器区域 / Editor Area
        </YdContextMenuTrigger>
        <YdContextMenuContent>
          <YdContextMenuGroup>
            <YdContextMenuLabel>编辑 / Edit</YdContextMenuLabel>
            <YdContextMenuItem>
              复制 / Copy
              <YdContextMenuShortcut>⌘C</YdContextMenuShortcut>
            </YdContextMenuItem>
            <YdContextMenuItem>
              粘贴 / Paste
              <YdContextMenuShortcut>⌘V</YdContextMenuShortcut>
            </YdContextMenuItem>
            <YdContextMenuItem>
              剪切 / Cut
              <YdContextMenuShortcut>⌘X</YdContextMenuShortcut>
            </YdContextMenuItem>
          </YdContextMenuGroup>
          <YdContextMenuSeparator />
          <YdContextMenuItem>
            全选 / Select All
            <YdContextMenuShortcut>⌘A</YdContextMenuShortcut>
          </YdContextMenuItem>
        </YdContextMenuContent>
      </YdContextMenu>
    `,
  }),
};

/** 带 disabled 项 / With Disabled Items */
export const WithDisabledItems: Story = {
  render: () => ({
    components: {
      YdContextMenu,
      YdContextMenuTrigger,
      YdContextMenuContent,
      YdContextMenuItem,
      YdContextMenuSeparator,
    },
    template: `
      <YdContextMenu>
        <YdContextMenuTrigger class="flex h-20 w-full items-center justify-center rounded border border-dashed text-sm">
          右键 / Right-click
        </YdContextMenuTrigger>
        <YdContextMenuContent>
          <YdContextMenuItem>撤消 / Undo</YdContextMenuItem>
          <YdContextMenuItem :disabled="true">重做 / Redo</YdContextMenuItem>
          <YdContextMenuSeparator />
          <YdContextMenuItem :disabled="true">
            删除 / Delete
          </YdContextMenuItem>
        </YdContextMenuContent>
      </YdContextMenu>
    `,
  }),
};
