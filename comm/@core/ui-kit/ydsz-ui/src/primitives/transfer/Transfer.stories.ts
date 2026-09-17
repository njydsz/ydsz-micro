/**
 * Transfer 穿梭框组件 Stories。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\transfer\Transfer.stories.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { Meta, StoryObj } from '@storybook/vue3';

import YdTransfer from './YdTransfer.vue';

const sampleData = Array.from({ length: 20 }, (_, i) => ({
  key: `item-${i}`,
  label: `Item ${i}`,
}));

const meta = {
  component: YdTransfer,
  tags: ['autodocs'],
  title: 'Primitives/Transfer',
  argTypes: {
    disabled: { control: 'boolean' },
    value: { control: 'object' },
  },
} satisfies Meta<typeof YdTransfer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    dataSource: sampleData,
    value: ['item-1', 'item-2'],
  },
};

export const Disabled: Story = {
  args: {
    dataSource: sampleData,
    disabled: true,
    value: ['item-1'],
  },
};
