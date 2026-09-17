/**
 * Skeleton 骨架屏组件 Stories。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\skeleton\Skeleton.stories.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { Meta, StoryObj } from '@storybook/vue3';

import YdSkeleton from './YdSkeleton.vue';

const meta = {
  component: YdSkeleton,
  tags: ['autodocs'],
  title: 'Primitives/Skeleton',
  argTypes: {
    variant: {
      control: 'select',
      options: ['text', 'circular', 'rectangular', 'rounded'],
    },
    shimmer: { control: 'boolean' },
  },
} satisfies Meta<typeof YdSkeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Text: Story = {
  args: {
    variant: 'text',
  },
};

export const Circular: Story = {
  args: {
    variant: 'circular',
    width: '48px',
    height: '48px',
  },
};

export const Rectangular: Story = {
  args: {
    height: '120px',
    variant: 'rectangular',
    width: '200px',
  },
};

export const Rounded: Story = {
  args: {
    height: '80px',
    variant: 'rounded',
    width: '240px',
  },
};

export const ProfileCard: Story = {
  render: () => ({
    components: { YdSkeleton },
    template: `
      <div class="flex items-center gap-3 p-4 border rounded-lg">
        <YdSkeleton variant="circular" width="48px" height="48px" />
        <div class="flex flex-col gap-2 flex-1">
          <YdSkeleton variant="text" width="60%" height="16px" />
          <YdSkeleton variant="text" width="40%" height="12px" />
        </div>
      </div>
    `,
  }),
};
