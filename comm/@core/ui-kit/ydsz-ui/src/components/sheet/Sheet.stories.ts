/**
 * YdSheet 组件 Storybook Stories。
 *
 * P0-3: 补齐 stories —— Sheet 抽屉（11 文件，此前零覆盖）。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\sheet\Sheet.stories.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { Meta, StoryObj } from '@storybook/vue3';

import YdSheet from './YdSheet.vue';
import YdSheetClose from './YdSheetClose.vue';
import YdSheetContent from './YdSheetContent.vue';
import YdSheetDescription from './YdSheetDescription.vue';
import YdSheetFooter from './YdSheetFooter.vue';
import YdSheetHeader from './YdSheetHeader.vue';
import YdSheetTitle from './YdSheetTitle.vue';
import YdSheetTrigger from './YdSheetTrigger.vue';

const meta: Meta<typeof YdSheet> = {
  title: 'Primitives/YdSheet',
  component: YdSheet,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '抽屉组件（侧边面板）。基于 Dialog Root 封装，支持 top / right / bottom / left 四个方位滑入。',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** 默认右侧抽屉 */
export const Default: Story = {
  render: () => ({
    components: {
      YdSheet,
      YdSheetTrigger,
      YdSheetContent,
      YdSheetHeader,
      YdSheetTitle,
      YdSheetDescription,
      YdSheetFooter,
      YdSheetClose,
    },
    template: `
      <YdSheet>
        <YdSheetTrigger as-child>
          <button class="yd-btn">打开抽屉</button>
        </YdSheetTrigger>
        <YdSheetContent side="right" :overlay-blur="4">
          <YdSheetHeader>
            <YdSheetTitle>抽屉标题</YdSheetTitle>
            <YdSheetDescription>抽屉描述内容</YdSheetDescription>
          </YdSheetHeader>
          <div class="py-4">
            <p>抽屉内容区域。</p>
          </div>
          <YdSheetFooter>
            <YdSheetClose as-child>
              <button class="yd-btn yd-btn-secondary">关闭</button>
            </YdSheetClose>
          </YdSheetFooter>
        </YdSheetContent>
      </YdSheet>
    `,
  }),
};

/** 左侧抽屉 */
export const Left: Story = {
  render: () => ({
    components: {
      YdSheet,
      YdSheetTrigger,
      YdSheetContent,
      YdSheetHeader,
      YdSheetTitle,
    },
    template: `
      <YdSheet>
        <YdSheetTrigger as-child>
          <button class="yd-btn">左抽屉</button>
        </YdSheetTrigger>
        <YdSheetContent side="left" :overlay-blur="2">
          <YdSheetHeader>
            <YdSheetTitle>左侧抽屉</YdSheetTitle>
          </YdSheetHeader>
          <p class="py-4">抽屉从左侧滑入。</p>
        </YdSheetContent>
      </YdSheet>
    `,
  }),
};

/** 顶部抽屉 */
export const Top: Story = {
  render: () => ({
    components: {
      YdSheet,
      YdSheetTrigger,
      YdSheetContent,
      YdSheetHeader,
      YdSheetTitle,
    },
    template: `
      <YdSheet>
        <YdSheetTrigger as-child>
          <button class="yd-btn">顶抽屉</button>
        </YdSheetTrigger>
        <YdSheetContent side="top">
          <YdSheetHeader>
            <YdSheetTitle>顶部抽屉</YdSheetTitle>
          </YdSheetHeader>
          <p class="py-4">抽屉从顶部滑入。</p>
        </YdSheetContent>
      </YdSheet>
    `,
  }),
};

/** 底部抽屉（常用于移动端） */
export const Bottom: Story = {
  render: () => ({
    components: {
      YdSheet,
      YdSheetTrigger,
      YdSheetContent,
      YdSheetHeader,
      YdSheetTitle,
    },
    template: `
      <YdSheet>
        <YdSheetTrigger as-child>
          <button class="yd-btn">底抽屉</button>
        </YdSheetTrigger>
        <YdSheetContent side="bottom">
          <YdSheetHeader>
            <YdSheetTitle>底部抽屉</YdSheetTitle>
          </YdSheetHeader>
          <p class="py-4">底部工作表样式。</p>
        </YdSheetContent>
      </YdSheet>
    `,
  }),
};

/** 不显示遮罩层 */
export const NoOverlay: Story = {
  render: () => ({
    components: {
      YdSheet,
      YdSheetTrigger,
      YdSheetContent,
      YdSheetHeader,
      YdSheetTitle,
    },
    template: `
      <YdSheet :modal="false">
        <YdSheetTrigger as-child>
          <button class="yd-btn">无遮罩</button>
        </YdSheetTrigger>
        <YdSheetContent side="right">
          <YdSheetHeader>
            <YdSheetTitle>无遮罩抽屉</YdSheetTitle>
          </YdSheetHeader>
          <p class="py-4">关闭后可继续与主内容交互。</p>
        </YdSheetContent>
      </YdSheet>
    `,
  }),
};

/** 自定义 z-index / Custom z-index */
export const CustomZIndex: Story = {
  render: () => ({
    components: {
      YdSheet,
      YdSheetTrigger,
      YdSheetContent,
      YdSheetTitle,
    },
    template: `
      <YdSheet>
        <YdSheetTrigger as-child>
          <button class="yd-btn">Z-Index</button>
        </YdSheetTrigger>
        <YdSheetContent side="right" :z-index="9999">
          <YdSheetTitle>Z-Index 9999</YdSheetTitle>
          <p class="py-4">自定义堆叠层级。/ Custom stacking level.</p>
        </YdSheetContent>
      </YdSheet>
    `,
  }),
};

/** 带表单的抽屉 / Sheet with form */
export const WithForm: Story = {
  render: () => ({
    components: {
      YdSheet,
      YdSheetTrigger,
      YdSheetContent,
      YdSheetHeader,
      YdSheetTitle,
      YdSheetDescription,
      YdSheetFooter,
      YdSheetClose,
    },
    template: `
      <YdSheet>
        <YdSheetTrigger as-child>
          <button class="yd-btn">新建用户 / Create User</button>
        </YdSheetTrigger>
        <YdSheetContent side="right" :overlay-blur="4">
          <YdSheetHeader>
            <YdSheetTitle>新建用户 / Create User</YdSheetTitle>
            <YdSheetDescription>填写以下信息创建新用户。/ Fill in the info to create a new user.</YdSheetDescription>
          </YdSheetHeader>
          <div class="space-y-4 py-4">
            <div class="space-y-2">
              <label class="text-sm font-medium">用户名 / Username</label>
              <input class="yd-input w-full" placeholder="请输入用户名" />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">邮箱 / Email</label>
              <input class="yd-input w-full" placeholder="user@example.com" />
            </div>
          </div>
          <YdSheetFooter>
            <YdSheetClose as-child>
              <button class="yd-btn yd-btn-secondary">取消 / Cancel</button>
            </YdSheetClose>
            <button class="yd-btn">保存 / Save</button>
          </YdSheetFooter>
        </YdSheetContent>
      </YdSheet>
    `,
  }),
};

/** 无遮罩、ESC 关闭 / No overlay with ESC close */
export const EscCloseNoOverlay: Story = {
  render: () => ({
    components: {
      YdSheet,
      YdSheetTrigger,
      YdSheetContent,
      YdSheetHeader,
      YdSheetTitle,
      YdSheetClose,
    },
    template: `
      <YdSheet>
        <YdSheetTrigger as-child>
          <button class="yd-btn">ESC 关闭 / ESC Close</button>
        </YdSheetTrigger>
        <YdSheetContent side="right" :modal="false">
          <YdSheetHeader>
            <YdSheetTitle>无遮罩抽屉 / No Overlay</YdSheetTitle>
          </YdSheetHeader>
          <p class="py-4">按 Escape 关闭，无遮罩。/ Press Escape to close, no overlay.</p>
          <YdSheetClose as-child>
            <button class="yd-btn yd-btn-secondary">关闭 / Close</button>
          </YdSheetClose>
        </YdSheetContent>
      </YdSheet>
    `,
  }),
};

/** 遮罩模糊 / Overlay blur variants */
export const OverlayBlurVariants: Story = {
  render: () => ({
    components: {
      YdSheet,
      YdSheetTrigger,
      YdSheetContent,
      YdSheetHeader,
      YdSheetTitle,
    },
    template: `
      <div class="flex gap-2">
        <YdSheet>
          <YdSheetTrigger as-child>
            <button class="yd-btn">Blur 2px</button>
          </YdSheetTrigger>
          <YdSheetContent side="right" :overlay-blur="2">
            <YdSheetHeader><YdSheetTitle>轻模糊 / Light Blur</YdSheetHeader>
            <p class="py-4">遮罩模糊 2px。/ Overlay blur 2px.</p>
          </YdSheetContent>
        </YdSheet>
        <YdSheet>
          <YdSheetTrigger as-child>
            <button class="yd-btn">Blur 8px</button>
          </YdSheetTrigger>
          <YdSheetContent side="right" :overlay-blur="8">
            <YdSheetHeader><YdSheetTitle>重模糊 / Heavy Blur</YdSheetHeader>
            <p class="py-4">遮罩模糊 8px。/ Overlay blur 8px.</p>
          </YdSheetContent>
        </YdSheet>
      </div>
    `,
  }),
};
