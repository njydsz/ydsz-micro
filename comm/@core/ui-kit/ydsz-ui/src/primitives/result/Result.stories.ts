/**
 * Result 结果页组件 Stories。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\result\Result.stories.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { Meta, StoryObj } from '@storybook/vue3';

import YdResult from './Result.vue';

const meta = {
  component: YdResult,
  tags: ['autodocs'],
  title: 'Primitives/Result',
  argTypes: {
    status: {
      control: 'select',
      options: ['success', 'error', 'warning', 'info'],
    },
  },
} satisfies Meta<typeof YdResult>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Success: Story = {
  args: {
    status: 'success',
    title: '提交成功',
    description: '您的申请已提交，将在 3 个工作日内完成审核',
  },
};

export const Error: Story = {
  args: {
    status: 'error',
    title: '提交失败',
    description: '提交过程中发生错误，请稍后重试',
  },
};

export const Warning: Story = {
  args: {
    status: 'warning',
    title: '部分失败',
    description: '部分数据未能保存，请检查输入后重试',
  },
};

export const Info: Story = {
  args: {
    status: 'info',
    title: '提示',
    description: '当前操作不会影响已发布的内容',
  },
};
