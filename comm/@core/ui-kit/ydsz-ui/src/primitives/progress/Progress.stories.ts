/**
 * Progress 进度条组件 Stories。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\progress\Progress.stories.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { Meta, StoryObj } from '@storybook/vue3';

import YdProgress from './YdProgress.vue';

const meta = {
  component: YdProgress,
  tags: ['autodocs'],
  title: 'Primitives/Progress',
  argTypes: {
    percentage: { control: { type: 'range', max: 100, min: 0, step: 1 } },
    indeterminate: { control: 'boolean' },
    onDone: { action: 'done' },
  },
} satisfies Meta<typeof YdProgress>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Determinate: Story = {
  args: {
    percentage: 65,
  },
};

export const Indeterminate: Story = {
  args: {
    indeterminate: true,
  },
};

export const Empty: Story = {
  args: {
    percentage: 0,
  },
};

export const Full: Story = {
  args: {
    percentage: 100,
  },
};
