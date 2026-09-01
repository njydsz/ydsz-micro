/**
 * Button 组件 Storybook Stories
 *
 * P1-2.3: 组件文档化 — Button 组件交互式文档
 *
 * @path comm/@core/ui-kit/shadcn-ui/src/ui/button/Button.stories.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { Meta, StoryObj } from '@storybook/vue3';

import Button from './Button.vue';

const meta: Meta<typeof Button> = {
  title: 'Core/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: '按钮变体样式',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
      description: '按钮尺寸',
    },
    as: {
      control: 'select',
      options: ['button', 'a', 'div'],
      description: '渲染的 HTML 元素',
    },
    disabled: {
      control: 'boolean',
      description: '是否禁用',
    },
  },
  parameters: {
    docs: {
      description: {
        component: '按钮组件用于触发操作或事件，支持多种变体和尺寸。',
      },
    },
  },
};

/**
 * Button 组件示例集的 Storybook 元信息。
 *
 * 覆盖的状态：
 *  - 全部 6 个 `variant`：default / destructive / outline / secondary / ghost / link；
 *  - 全部 4 个 `size`：default / sm / lg / icon；
 *  - 交互与语义状态：`disabled` 禁用态，以及 `as` 切换渲染元素（button / a / div）。
 *
 * 另有 `AllVariants`、`AllSizes` 两个同屏对照 story，用于一次性横向评审样式，
 * 以及回归时肉眼比对 Tailwind class 是否被 tailwind-merge 误合并。
 *
 * meta 上声明了 `argTypes`，因此在 Storybook 面板里可实时切换上述取值，
 * 无需改代码即可验证 variant 与 size 的组合。
 */
export default meta;
type Story = StoryObj<typeof Button>;

/** 默认按钮 */
export const Default: Story = {
  render: (args) => ({
    components: { Button },
    setup() {
      return { args };
    },
    template: '<Button v-bind="args">默认按钮</Button>',
  }),
  args: {
    variant: 'default',
    size: 'default',
  },
};

/** 危险按钮（用于删除等危险操作） */
export const Destructive: Story = {
  render: (args) => ({
    components: { Button },
    setup() {
      return { args };
    },
    template: '<Button v-bind="args">删除</Button>',
  }),
  args: {
    variant: 'destructive',
    size: 'default',
  },
};

/** 轮廓按钮 */
export const Outline: Story = {
  render: (args) => ({
    components: { Button },
    setup() {
      return { args };
    },
    template: '<Button v-bind="args">轮廓按钮</Button>',
  }),
  args: {
    variant: 'outline',
    size: 'default',
  },
};

/** 次要按钮 */
export const Secondary: Story = {
  render: (args) => ({
    components: { Button },
    setup() {
      return { args };
    },
    template: '<Button v-bind="args">次要按钮</Button>',
  }),
  args: {
    variant: 'secondary',
    size: 'default',
  },
};

/** 幽灵按钮（透明背景） */
export const Ghost: Story = {
  render: (args) => ({
    components: { Button },
    setup() {
      return { args };
    },
    template: '<Button v-bind="args">幽灵按钮</Button>',
  }),
  args: {
    variant: 'ghost',
    size: 'default',
  },
};

/** 链接按钮 */
export const Link: Story = {
  render: (args) => ({
    components: { Button },
    setup() {
      return { args };
    },
    template: '<Button v-bind="args">链接按钮</Button>',
  }),
  args: {
    variant: 'link',
    size: 'default',
  },
};

/** 小尺寸按钮 */
export const Small: Story = {
  render: (args) => ({
    components: { Button },
    setup() {
      return { args };
    },
    template: '<Button v-bind="args">小按钮</Button>',
  }),
  args: {
    variant: 'default',
    size: 'sm',
  },
};

/** 大尺寸按钮 */
export const Large: Story = {
  render: (args) => ({
    components: { Button },
    setup() {
      return { args };
    },
    template: '<Button v-bind="args">大按钮</Button>',
  }),
  args: {
    variant: 'default',
    size: 'lg',
  },
};

/** 图标按钮 */
export const Icon: Story = {
  render: (args) => ({
    components: { Button },
    setup() {
      return { args };
    },
    template: '<Button v-bind="args">🔍</Button>',
  }),
  args: {
    variant: 'outline',
    size: 'icon',
  },
};

/** 禁用状态 */
export const Disabled: Story = {
  render: (args) => ({
    components: { Button },
    setup() {
      return { args };
    },
    template: '<Button v-bind="args">禁用按钮</Button>',
  }),
  args: {
    variant: 'default',
    size: 'default',
    disabled: true,
  },
};

/** 所有变体展示 */
export const AllVariants: Story = {
  render: () => ({
    components: { Button },
    template: `
      <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
        <Button variant="default">默认</Button>
        <Button variant="destructive">危险</Button>
        <Button variant="outline">轮廓</Button>
        <Button variant="secondary">次要</Button>
        <Button variant="ghost">幽灵</Button>
        <Button variant="link">链接</Button>
      </div>
    `,
  }),
};

/** 所有尺寸展示 */
export const AllSizes: Story = {
  render: () => ({
    components: { Button },
    template: `
      <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
        <Button size="sm">小</Button>
        <Button size="default">默认</Button>
        <Button size="lg">大</Button>
        <Button size="icon">🔍</Button>
      </div>
    `,
  }),
};
