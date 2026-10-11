/**
 * YdButtonSmart Stories —— 业务通用按钮演练场。
 *
 * 基础 primitive Button 的 stories 位于 primitives/button/；
 * YdIconButton / YdButtonGroup / YdCheckButtonGroup 的 stories 参见各自目录。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\button\Button.stories.ts
 * @author ydsz-team
 * @since 26.10.10
 */
import type { Meta, StoryObj } from '@storybook/vue3';

import YdButtonSmart from './YdButtonSmart.vue';

const meta = {
  title: 'Components/ButtonSmart',
  component: YdButtonSmart,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link', 'icon'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
  },
  parameters: {
    docs: {
      description: {
        component: 'YdButtonSmart —— 业务通用按钮，在 primitive 之上补充 loading 态。',
      },
    },
  },
} satisfies Meta<typeof YdButtonSmart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 默认按钮 */
export const Default: Story = {
  args: { variant: 'default', size: 'default' },
  render: (args) => ({
    components: { YdButtonSmart },
    setup() { return { args } },
    template: '<YdButtonSmart v-bind="args">默认按钮</YdButtonSmart>',
  }),
};

/** 加载态（需同时设置 disabled 才能禁止点击） */
export const Loading: Story = {
  args: { variant: 'default', loading: true },
  render: (args) => ({
    components: { YdButtonSmart },
    setup() { return { args } },
    template: '<YdButtonSmart v-bind="args">提交中...</YdButtonSmart>',
  }),
};

/** 危险按钮（用于删除等危险操作） */
export const Destructive: Story = {
  args: { variant: 'destructive', size: 'default' },
  render: (args) => ({
    components: { YdButtonSmart },
    setup() { return { args } },
    template: '<YdButtonSmart v-bind="args">删除</YdButtonSmart>',
  }),
};

/** 禁用状态 */
export const Disabled: Story = {
  args: { variant: 'default', disabled: true },
  render: (args) => ({
    components: { YdButtonSmart },
    setup() { return { args } },
    template: '<YdButtonSmart v-bind="args">禁用按钮</YdButtonSmart>',
  }),
};

/** 小尺寸 */
export const Small: Story = {
  args: { variant: 'default', size: 'sm' },
  render: (args) => ({
    components: { YdButtonSmart },
    setup() { return { args } },
    template: '<YdButtonSmart v-bind="args">小按钮</YdButtonSmart>',
  }),
};

/** 大尺寸 */
export const Large: Story = {
  args: { variant: 'default', size: 'lg' },
  render: (args) => ({
    components: { YdButtonSmart },
    setup() { return { args } },
    template: '<YdButtonSmart v-bind="args">大按钮</YdButtonSmart>',
  }),
};

/** 轮廓按钮 */
export const Outline: Story = {
  args: { variant: 'outline', size: 'default' },
  render: (args) => ({
    components: { YdButtonSmart },
    setup() { return { args } },
    template: '<YdButtonSmart v-bind="args">轮廓按钮</YdButtonSmart>',
  }),
};

/** 幽灵按钮 */
export const Ghost: Story = {
  args: { variant: 'ghost', size: 'default' },
  render: (args) => ({
    components: { YdButtonSmart },
    setup() { return { args } },
    template: '<YdButtonSmart v-bind="args">幽灵按钮</YdButtonSmart>',
  }),
};

/** 所有变体一览 */
export const AllVariants: Story = {
  render: () => ({
    components: { YdButtonSmart },
    template: `
      <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
        <YdButtonSmart variant="default">默认</YdButtonSmart>
        <YdButtonSmart variant="destructive">危险</YdButtonSmart>
        <YdButtonSmart variant="outline">轮廓</YdButtonSmart>
        <YdButtonSmart variant="secondary">次要</YdButtonSmart>
        <YdButtonSmart variant="ghost">幽灵</YdButtonSmart>
        <YdButtonSmart variant="link">链接</YdButtonSmart>
      </div>
    `,
  }),
};
