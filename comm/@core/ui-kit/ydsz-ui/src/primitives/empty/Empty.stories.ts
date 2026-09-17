/**
 * Empty 空状态组件 Stories。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\empty\Empty.stories.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { Meta, StoryObj } from '@storybook/vue3';

import YdEmpty from './YdEmpty.vue';

const meta = {
  component: YdEmpty,
  tags: ['autodocs'],
  title: 'Primitives/Empty',
  argTypes: {
    description: { control: 'text' },
    showIcon: { control: 'boolean' },
  },
} satisfies Meta<typeof YdEmpty>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    description: '暂无数据',
  },
};

export const NoIcon: Story = {
  args: {
    description: '没有找到相关内容',
    showIcon: false,
  },
};

export const WithAction: Story = {
  args: {
    description: '还没有创建任何项目',
  },
  render: (args: any) => ({
    components: { YdEmpty },
    setup: () => ({ args }),
    template: `
      <YdEmpty v-bind="args">
        <button class="mt-2 rounded bg-primary px-3 py-1 text-sm text-primary-foreground">立即创建</button>
      </YdEmpty>
    `,
  }),
};
