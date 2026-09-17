/**
 * YdDropdownMenu 组件 Storybook Stories。
 *
 * P0-3: 补齐 stories —— DropdownMenu（15 文件，此前零覆盖）。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\dropdown-menu\DropdownMenu.stories.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { Meta, StoryObj } from '@storybook/vue3';

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

const meta: Meta<typeof YdDropdownMenu> = {
  title: 'Primitives/YdDropdownMenu',
  component: YdDropdownMenu,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '下拉菜单。基于 Radix Dropdown Menu 封装，支持 Group / Submenu / Checkbox / Radio / Separator 等复合模式。',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** 基础菜单 */
export const Default: Story = {
  render: () => ({
    components: {
      YdDropdownMenu,
      YdDropdownMenuTrigger,
      YdDropdownMenuContent,
      YdDropdownMenuItem,
      YdDropdownMenuLabel,
      YdDropdownMenuSeparator,
      YdDropdownMenuShortcut,
    },
    template: `
      <YdDropdownMenu>
        <YdDropdownMenuTrigger as-child>
          <button class="yd-btn">操作</button>
        </YdDropdownMenuTrigger>
        <YdDropdownMenuContent>
          <YdDropdownMenuLabel>账户</YdDropdownMenuLabel>
          <YdDropdownMenuSeparator />
          <YdDropdownMenuItem>
            个人设置
            <YdDropdownMenuShortcut>⌘S</YdDropdownMenuShortcut>
          </YdDropdownMenuItem>
          <YdDropdownMenuItem>
            团队管理
            <YdDropdownMenuShortcut>⇧⌘T</YdDropdownMenuShortcut>
          </YdDropdownMenuItem>
          <YdDropdownMenuItem inset>
            偏好设置
          </YdDropdownMenuItem>
        </YdDropdownMenuContent>
      </YdDropdownMenu>
    `,
  }),
};

/** 带 Checkbox 选项 */
export const WithCheckbox: Story = {
  render: () => ({
    components: {
      YdDropdownMenu,
      YdDropdownMenuTrigger,
      YdDropdownMenuContent,
      YdDropdownMenuCheckboxItem,
      YdDropdownMenuLabel,
      YdDropdownMenuSeparator,
    },
    template: `
      <YdDropdownMenu>
        <YdDropdownMenuTrigger as-child>
          <button class="yd-btn">显示选项</button>
        </YdDropdownMenuTrigger>
        <YdDropdownMenuContent>
          <YdDropdownMenuLabel>显示</YdDropdownMenuLabel>
          <YdDropdownMenuSeparator />
          <YdDropdownMenuCheckboxItem :checked="true">
            侧边栏
          </YdDropdownMenuCheckboxItem>
          <YdDropdownMenuCheckboxItem :checked="true">
            工具栏
          </YdDropdownMenuCheckboxItem>
          <YdDropdownMenuCheckboxItem :checked="false">
            状态栏
          </YdDropdownMenuCheckboxItem>
        </YdDropdownMenuContent>
      </YdDropdownMenu>
    `,
  }),
};

/** 带 Radio 组 */
export const WithRadio: Story = {
  render: () => ({
    components: {
      YdDropdownMenu,
      YdDropdownMenuTrigger,
      YdDropdownMenuContent,
      YdDropdownMenuRadioGroup,
      YdDropdownMenuRadioItem,
      YdDropdownMenuLabel,
      YdDropdownMenuSeparator,
    },
    template: `
      <YdDropdownMenu>
        <YdDropdownMenuTrigger as-child>
          <button class="yd-btn">主题</button>
        </YdDropdownMenuTrigger>
        <YdDropdownMenuContent>
          <YdDropdownMenuLabel>主题模式</YdDropdownMenuLabel>
          <YdDropdownMenuSeparator />
          <YdDropdownMenuRadioGroup value="auto">
            <YdDropdownMenuRadioItem value="light">浅色</YdDropdownMenuRadioItem>
            <YdDropdownMenuRadioItem value="dark">深色</YdDropdownMenuRadioItem>
            <YdDropdownMenuRadioItem value="auto">跟随系统</YdDropdownMenuRadioItem>
          </YdDropdownMenuRadioGroup>
        </YdDropdownMenuContent>
      </YdDropdownMenu>
    `,
  }),
};

/** 带 Submenu */
export const WithSubmenu: Story = {
  render: () => ({
    components: {
      YdDropdownMenu,
      YdDropdownMenuTrigger,
      YdDropdownMenuContent,
      YdDropdownMenuItem,
      YdDropdownMenuSub,
      YdDropdownMenuSubTrigger,
      YdDropdownMenuSubContent,
    },
    template: `
      <YdDropdownMenu>
        <YdDropdownMenuTrigger as-child>
          <button class="yd-btn">更多</button>
        </YdDropdownMenuTrigger>
        <YdDropdownMenuContent>
          <YdDropdownMenuItem>新建</YdDropdownMenuItem>
          <YdDropdownMenuSub>
            <YdDropdownMenuSubTrigger>分享</YdDropdownMenuSubTrigger>
            <YdDropdownMenuSubContent>
              <YdDropdownMenuItem>邮件</YdDropdownMenuItem>
              <YdDropdownMenuItem>链接</YdDropdownMenuItem>
              <YdDropdownMenuItem>二维码</YdDropdownMenuItem>
            </YdDropdownMenuSubContent>
          </YdDropdownMenuSub>
        </YdDropdownMenuContent>
      </YdDropdownMenu>
    `,
  }),
};

/** 使用 Group 分组 / With Groups */
export const WithGroups: Story = {
  render: () => ({
    components: {
      YdDropdownMenu,
      YdDropdownMenuTrigger,
      YdDropdownMenuContent,
      YdDropdownMenuGroup,
      YdDropdownMenuItem,
      YdDropdownMenuLabel,
      YdDropdownMenuSeparator,
    },
    template: `
      <YdDropdownMenu>
        <YdDropdownMenuTrigger as-child>
          <button class="yd-btn">分组 / Groups</button>
        </YdDropdownMenuTrigger>
        <YdDropdownMenuContent>
          <YdDropdownMenuGroup>
            <YdDropdownMenuLabel>基础 / Basic</YdDropdownMenuLabel>
            <YdDropdownMenuItem>复制 / Copy</YdDropdownMenuItem>
            <YdDropdownMenuItem>粘贴 / Paste</YdDropdownMenuItem>
          </YdDropdownMenuGroup>
          <YdDropdownMenuSeparator />
          <YdDropdownMenuGroup>
            <YdDropdownMenuLabel>高级 / Advanced</YdDropdownMenuLabel>
            <YdDropdownMenuItem>合并单元格 / Merge</YdDropdownMenuItem>
            <YdDropdownMenuItem>拆分表格 / Split</YdDropdownMenuItem>
          </YdDropdownMenuGroup>
        </YdDropdownMenuContent>
      </YdDropdownMenu>
    `,
  }),
};

/** 带 Disabled 项 / With Disabled Items */
export const WithDisabledItems: Story = {
  render: () => ({
    components: {
      YdDropdownMenu,
      YdDropdownMenuTrigger,
      YdDropdownMenuContent,
      YdDropdownMenuItem,
      YdDropdownMenuSeparator,
      YdDropdownMenuShortcut,
    },
    template: `
      <YdDropdownMenu>
        <YdDropdownMenuTrigger as-child>
          <button class="yd-btn">含禁用 / Disabled</button>
        </YdDropdownMenuTrigger>
        <YdDropdownMenuContent>
          <YdDropdownMenuItem>
            编辑 / Edit
            <YdDropdownMenuShortcut>⌘E</YdDropdownMenuShortcut>
          </YdDropdownMenuItem>
          <YdDropdownMenuItem :disabled="true">
            归档 / Archive
          </YdDropdownMenuItem>
          <YdDropdownMenuSeparator />
          <YdDropdownMenuItem :disabled="true">
            删除 / Delete
            <YdDropdownMenuShortcut>⌘⌫</YdDropdownMenuShortcut>
          </YdDropdownMenuItem>
        </YdDropdownMenuContent>
      </YdDropdownMenu>
    `,
  }),
};

/** 嵌套子菜单 / Nested Submenu */
export const NestedSubmenu: Story = {
  render: () => ({
    components: {
      YdDropdownMenu,
      YdDropdownMenuTrigger,
      YdDropdownMenuContent,
      YdDropdownMenuItem,
      YdDropdownMenuSub,
      YdDropdownMenuSubTrigger,
      YdDropdownMenuSubContent,
      YdDropdownMenuSeparator,
    },
    template: `
      <YdDropdownMenu>
        <YdDropdownMenuTrigger as-child>
          <button class="yd-btn">嵌套子菜单 / Nested</button>
        </YdDropdownMenuTrigger>
        <YdDropdownMenuContent>
          <YdDropdownMenuItem>新建 / New</YdDropdownMenuItem>
          <YdDropdownMenuSeparator />
          <YdDropdownMenuSub>
            <YdDropdownMenuSubTrigger>导入 / Import</YdDropdownMenuSubTrigger>
            <YdDropdownMenuSubContent>
              <YdDropdownMenuItem>CSV</YdDropdownMenuItem>
              <YdDropdownMenuItem>JSON</YdDropdownMenuItem>
              <YdDropdownMenuSub>
                <YdDropdownMenuSubTrigger>Excel</YdDropdownMenuSubTrigger>
                <YdDropdownMenuSubContent>
                  <YdDropdownMenuItem>.xlsx</YdDropdownMenuItem>
                  <YdDropdownMenuItem>.xls</YdDropdownMenuItem>
                </YdDropdownMenuSubContent>
              </YdDropdownMenuSub>
            </YdDropdownMenuSubContent>
          </YdDropdownMenuSub>
        </YdDropdownMenuContent>
      </YdDropdownMenu>
    `,
  }),
};
