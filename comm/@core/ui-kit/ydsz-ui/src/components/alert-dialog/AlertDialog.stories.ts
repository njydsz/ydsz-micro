/**
 * YdAlertDialog 组件 Storybook Stories。
 *
 * P0-3: 补齐 stories —— AlertDialog（9 文件，此前零覆盖）。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\alert-dialog\AlertDialog.stories.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { Meta, StoryObj } from '@storybook/vue3';

import YdAlertDialog from './YdAlertDialog.vue';
import YdAlertDialogAction from './YdAlertDialogAction.vue';
import YdAlertDialogCancel from './YdAlertDialogCancel.vue';
import YdAlertDialogContent from './YdAlertDialogContent.vue';
import YdAlertDialogDescription from './YdAlertDialogDescription.vue';
import YdAlertDialogTitle from './YdAlertDialogTitle.vue';
import YdAlertDialogTrigger from './YdAlertDialogTrigger.vue';

const meta: Meta<typeof YdAlertDialog> = {
  title: 'Primitives/YdAlertDialog',
  component: YdAlertDialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '警告对话框，用于中断用户并要求确认某项高风险操作（删除、退出等）。',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** 默认确认删除 */
export const Default: Story = {
  render: () => ({
    components: {
      YdAlertDialog,
      YdAlertDialogTrigger,
      YdAlertDialogContent,
      YdAlertDialogTitle,
      YdAlertDialogDescription,
      YdAlertDialogAction,
      YdAlertDialogCancel,
    },
    template: `
      <YdAlertDialog>
        <YdAlertDialogTrigger as-child>
          <button class="yd-btn yd-btn-dangerous">删除项目</button>
        </YdAlertDialogTrigger>
        <YdAlertDialogContent>
          <YdAlertDialogTitle>确认删除?</YdAlertDialogTitle>
          <YdAlertDialogDescription>
            此操作不可撤销，确定要删除该项目吗？
          </YdAlertDialogDescription>
          <div class="flex justify-end gap-2">
            <YdAlertDialogCancel as-child>
              <button class="yd-btn yd-btn-secondary">取消</button>
            </YdAlertDialogCancel>
            <YdAlertDialogAction as-child>
              <button class="yd-btn yd-btn-dangerous">确认删除</button>
            </YdAlertDialogAction>
          </div>
        </YdAlertDialogContent>
      </YdAlertDialog>
    `,
  }),
};

/** 居中显示 */
export const Centered: Story = {
  render: () => ({
    components: {
      YdAlertDialog,
      YdAlertDialogTrigger,
      YdAlertDialogContent,
      YdAlertDialogTitle,
      YdAlertDialogDescription,
      YdAlertDialogAction,
      YdAlertDialogCancel,
    },
    template: `
      <YdAlertDialog>
        <YdAlertDialogTrigger as-child>
          <button class="yd-btn">居中警告</button>
        </YdAlertDialogTrigger>
        <YdAlertDialogContent :centered="true">
          <YdAlertDialogTitle>注意</YdAlertDialogTitle>
          <YdAlertDialogDescription>居中显示的警告内容。</YdAlertDialogDescription>
          <div class="flex justify-center gap-2">
            <YdAlertDialogCancel as-child>
              <button class="yd-btn yd-btn-secondary">取消</button>
            </YdAlertDialogCancel>
            <YdAlertDialogAction as-child>
              <button class="yd-btn">确认</button>
            </YdAlertDialogAction>
          </div>
        </YdAlertDialogContent>
      </YdAlertDialog>
    `,
  }),
};

/** 自定义 z-index */
export const CustomZIndex: Story = {
  render: () => ({
    components: {
      YdAlertDialog,
      YdAlertDialogTrigger,
      YdAlertDialogContent,
      YdAlertDialogTitle,
      YdAlertDialogCancel,
    },
    template: `
      <YdAlertDialog>
        <YdAlertDialogTrigger as-child>
          <button class="yd-btn">自定义层级</button>
        </YdAlertDialogTrigger>
        <YdAlertDialogContent :z-index="10000">
          <YdAlertDialogTitle>Z-Index 10000</YdAlertDialogTitle>
          <YdAlertDialogCancel as-child>
            <button class="yd-btn">关闭</button>
          </YdAlertDialogCancel>
        </YdAlertDialogContent>
      </YdAlertDialog>
    `,
  }),
};
