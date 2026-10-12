/**
 * Tag 标签组件 Stories。
 *
 * 展示各语义色、尺寸、可关闭三种模式。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\tag\Tag.stories.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { Meta, StoryObj } from '@storybook/vue3';

import YdTag from './YdTag.vue';

const meta = {
  component: YdTag,
  tags: ['autodocs'],
  title: 'Primitives/Tag',
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'success', 'warning', 'destructive', 'info'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    closable: { control: 'boolean' },
    onClose: { action: 'close' },
  },
} satisfies Meta<typeof YdTag>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    default: 'Default Tag',
    variant: 'default',
  },
};

export const Primary: Story = {
  args: {
    default: 'Primary Tag',
    variant: 'primary',
  },
};

export const Success: Story = {
  args: {
    default: 'Success',
    variant: 'success',
  },
};

export const Warning: Story = {
  args: {
    default: 'Warning',
    variant: 'warning',
  },
};

export const Destructive: Story = {
  args: {
    default: 'Destructive',
    variant: 'destructive',
  },
};

export const Info: Story = {
  args: {
    default: 'Info',
    variant: 'info',
  },
};

export const Closable: Story = {
  args: {
    closable: true,
    default: 'Closable Tag',
    variant: 'primary',
  },
};

export const Small: Story = {
  args: {
    default: 'Small',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    default: 'Large',
    size: 'lg',
  },
};
