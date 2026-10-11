/**
 * EmptyState Stories —— YdEmptyState 富空状态演练场。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\empty-state\EmptyState.stories.ts
 * @author ydsz-team
 * @since 26.10.10
 */
import type { Meta, StoryObj } from '@storybook/vue3';

import YdEmptyState from './YdEmptyState.vue';

const meta: Meta<typeof YdEmptyState> = {
  title: 'Components/EmptyState',
  component: YdEmptyState,
  tags: ['autodocs'],
  argTypes: {
    preset: {
      control: 'select',
      options: ['created', 'error', 'no-data', 'no-permission', 'no-result'],
      description: '预设场景图标',
    },
    title: { control: 'text', description: '自定义标题（不走 i18n）' },
    description: { control: 'text', description: '描述副标题' },
    actionText: { control: 'text', description: '操作按钮文案' },
  },
  parameters: {
    docs: {
      description: {
        component: 'YdEmptyState —— 富空状态，替代原生 "暂无数据"，提供图标 + 标题 + 描述 + 引导操作。',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof YdEmptyState>;

/** 无数据 */
export const NoData: Story = {
  render: () => ({
    components: { YdEmptyState },
    template: '<YdEmptyState preset="no-data" />',
  }),
};

/** 无搜索结果 */
export const NoResult: Story = {
  render: () => ({
    components: { YdEmptyState },
    template: `
      <YdEmptyState
        preset="no-result"
        title="未找到匹配结果"
        description="尝试更换关键词或调整筛选条件"
      />
    `,
  }),
};

/** 无权限 */
export const NoPermission: Story = {
  render: () => ({
    components: { YdEmptyState },
    template: `
      <YdEmptyState
        preset="no-permission"
        title="无访问权限"
        description="请联系管理员开通相应权限"
        actionText="申请权限"
      />
    `,
  }),
};

/** 创建引导 */
export const Created: Story = {
  render: () => ({
    components: { YdEmptyState },
    template: `
      <YdEmptyState
        preset="created"
        title="暂无内容"
        description="点击下方按钮开始创建您的第一个项目"
        actionText="立即创建"
      />
    `,
  }),
};

/** 错误状态 */
export const Error: Story = {
  render: () => ({
    components: { YdEmptyState },
    template: `
      <YdEmptyState
        preset="error"
        title="加载失败"
        description="数据加载出错，请检查网络连接后重试"
        actionText="重新加载"
      />
    `,
  }),
};

/** 自定义标题覆盖 i18n */
export const CustomTitle: Story = {
  render: () => ({
    components: { YdEmptyState },
    template: `
      <YdEmptyState
        preset="no-data"
        title="自定义标题"
        description="通过 title prop 可完全覆盖 i18n 兜底文案"
      />
    `,
  }),
};
