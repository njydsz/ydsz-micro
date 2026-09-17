/**
 * YdButtonBase 组件 Storybook Stories
 *
 * P1-2.3: 组件文档化 — YdButtonBase 组件交互式文档
 *
 * @path comm/@core/ui-kit/ydsz-ui/src/ui/button/YdButtonBase.stories.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { Meta, StoryObj } from '@storybook/vue3';

import YdButtonBase from './YdButtonBase.vue';

const meta: Meta<typeof YdButtonBase> = {
  title: 'Core/YdButtonBase',
  component: YdButtonBase,
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
 * YdButtonBase 组件示例集的 Storybook 元信息。
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
type Story = StoryObj<typeof YdButtonBase>;

/** 默认按钮 */
export const Default: Story = {
  render: (args) => ({
    components: { YdButtonBase },
    setup() {
      return { args };
    },
    template: '<YdButtonBase v-bind="args">默认按钮</YdButtonBase>',
  }),
  args: {
    variant: 'default',
    size: 'default',
  },
};

/** 危险按钮（用于删除等危险操作） */
export const Destructive: Story = {
  render: (args) => ({
    components: { YdButtonBase },
    setup() {
      return { args };
    },
    template: '<YdButtonBase v-bind="args">删除</YdButtonBase>',
  }),
  args: {
    variant: 'destructive',
    size: 'default',
  },
};

/** 轮廓按钮 */
export const Outline: Story = {
  render: (args) => ({
    components: { YdButtonBase },
    setup() {
      return { args };
    },
    template: '<YdButtonBase v-bind="args">轮廓按钮</YdButtonBase>',
  }),
  args: {
    variant: 'outline',
    size: 'default',
  },
};

/** 次要按钮 */
export const Secondary: Story = {
  render: (args) => ({
    components: { YdButtonBase },
    setup() {
      return { args };
    },
    template: '<YdButtonBase v-bind="args">次要按钮</YdButtonBase>',
  }),
  args: {
    variant: 'secondary',
    size: 'default',
  },
};

/** 幽灵按钮（透明背景） */
export const Ghost: Story = {
  render: (args) => ({
    components: { YdButtonBase },
    setup() {
      return { args };
    },
    template: '<YdButtonBase v-bind="args">幽灵按钮</YdButtonBase>',
  }),
  args: {
    variant: 'ghost',
    size: 'default',
  },
};

/** 链接按钮 */
export const Link: Story = {
  render: (args) => ({
    components: { YdButtonBase },
    setup() {
      return { args };
    },
    template: '<YdButtonBase v-bind="args">链接按钮</YdButtonBase>',
  }),
  args: {
    variant: 'link',
    size: 'default',
  },
};

/** 小尺寸按钮 */
export const Small: Story = {
  render: (args) => ({
    components: { YdButtonBase },
    setup() {
      return { args };
    },
    template: '<YdButtonBase v-bind="args">小按钮</YdButtonBase>',
  }),
  args: {
    variant: 'default',
    size: 'sm',
  },
};

/** 大尺寸按钮 */
export const Large: Story = {
  render: (args) => ({
    components: { YdButtonBase },
    setup() {
      return { args };
    },
    template: '<YdButtonBase v-bind="args">大按钮</YdButtonBase>',
  }),
  args: {
    variant: 'default',
    size: 'lg',
  },
};

/** 图标按钮 */
export const Icon: Story = {
  render: (args) => ({
    components: { YdButtonBase },
    setup() {
      return { args };
    },
    template: '<YdButtonBase v-bind="args">🔍</YdButtonBase>',
  }),
  args: {
    variant: 'outline',
    size: 'icon',
  },
};

/** 禁用状态 */
export const Disabled: Story = {
  render: (args) => ({
    components: { YdButtonBase },
    setup() {
      return { args };
    },
    template: '<YdButtonBase v-bind="args">禁用按钮</YdButtonBase>',
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
    components: { YdButtonBase },
    template: `
      <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
        <YdButtonBase variant="default">默认</YdButtonBase>
        <YdButtonBase variant="destructive">危险</YdButtonBase>
        <YdButtonBase variant="outline">轮廓</YdButtonBase>
        <YdButtonBase variant="secondary">次要</YdButtonBase>
        <YdButtonBase variant="ghost">幽灵</YdButtonBase>
        <YdButtonBase variant="link">链接</YdButtonBase>
      </div>
    `,
  }),
};

/** 所有尺寸展示 */
export const AllSizes: Story = {
  render: () => ({
    components: { YdButtonBase },
    template: `
      <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
        <YdButtonBase size="sm">小</YdButtonBase>
        <YdButtonBase size="default">默认</YdButtonBase>
        <YdButtonBase size="lg">大</YdButtonBase>
        <YdButtonBase size="icon">🔍</YdButtonBase>
      </div>
    `,
  }),
};
