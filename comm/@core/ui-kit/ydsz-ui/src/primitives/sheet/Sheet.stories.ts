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

/** 自定义 z-index */
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
          <p class="py-4">自定义堆叠层级。</p>
        </YdSheetContent>
      </YdSheet>
    `,
  }),
};
