/**
 * StatusBadge Stories —— YdStatusBadge 语义状态标签演练场。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\status-badge\StatusBadge.stories.ts
 * @author ydsz-team
 * @since 26.10.10
 */
import type { Meta, StoryObj } from '@storybook/vue3';

import YdStatusBadge from './YdStatusBadge.vue';

const meta: Meta<typeof YdStatusBadge> = {
  title: 'Components/StatusBadge',
  component: YdStatusBadge,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['draft', 'published', 'dirty', 'offline', 'archived', 'pending', 'running', 'success', 'failed'],
      description: '语义状态，决定配色与默认文案',
    },
    label: { control: 'text', description: '自定义标签文案（覆盖默认 i18n 兜底）' },
    dot: { control: 'boolean', description: '是否显示圆点指示器' },
  },
  parameters: {
    docs: {
      description: {
        component: 'YdStatusBadge —— 语义状态标签，在 primitive YdBadge 之上封装业务状态语义与无障碍圆点。',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof YdStatusBadge>;

/** 草稿 */
export const Draft: Story = {
  render: () => ({
    components: { YdStatusBadge },
    template: '<YdStatusBadge status="draft" />',
  }),
};

/** 已发布 */
export const Published: Story = {
  render: () => ({
    components: { YdStatusBadge },
    template: '<YdStatusBadge status="published" />',
  }),
};

/** 有变更未发布 */
export const Dirty: Story = {
  render: () => ({
    components: { YdStatusBadge },
    template: '<YdStatusBadge status="dirty" />',
  }),
};

/** 已下线 */
export const Offline: Story = {
  render: () => ({
    components: { YdStatusBadge },
    template: '<YdStatusBadge status="offline" />',
  }),
};

/** 已归档 */
export const Archived: Story = {
  render: () => ({
    components: { YdStatusBadge },
    template: '<YdStatusBadge status="archived" />',
  }),
};

/** 待执行 */
export const Pending: Story = {
  render: () => ({
    components: { YdStatusBadge },
    template: '<YdStatusBadge status="pending" />',
  }),
};

/** 运行中 */
export const Running: Story = {
  render: () => ({
    components: { YdStatusBadge },
    template: '<YdStatusBadge status="running" />',
  }),
};

/** 成功 */
export const Success: Story = {
  render: () => ({
    components: { YdStatusBadge },
    template: '<YdStatusBadge status="success" />',
  }),
};

/** 失败 */
export const Failed: Story = {
  render: () => ({
    components: { YdStatusBadge },
    template: '<YdStatusBadge status="failed" />',
  }),
};

/** 无障碍圆点与自定义标签 */
export const CustomLabelNoDot: Story = {
  render: () => ({
    components: { YdStatusBadge },
    template: '<YdStatusBadge status="running" label="Processing" :dot="false" />',
  }),
};

/** 全状态一览 */
export const AllStatuses: Story = {
  render: () => ({
    components: { YdStatusBadge },
    template: `
      <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
        <YdStatusBadge status="draft" />
        <YdStatusBadge status="published" />
        <YdStatusBadge status="dirty" />
        <YdStatusBadge status="offline" />
        <YdStatusBadge status="archived" />
        <YdStatusBadge status="pending" />
        <YdStatusBadge status="running" />
        <YdStatusBadge status="success" />
        <YdStatusBadge status="failed" />
      </div>
    `,
  }),
};
