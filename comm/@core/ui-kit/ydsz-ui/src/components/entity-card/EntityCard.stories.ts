/**
 * EntityCard Stories —— YdEntityCard / YdCardGrid 实体卡片演练场。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\entity-card\EntityCard.stories.ts
 * @author ydsz-team
 * @since 26.10.10
 */
import type { Meta, StoryObj } from '@storybook/vue3';

import YdCardGrid from './YdCardGrid.vue';
import YdEntityCard from './YdEntityCard.vue';

// ---------------------------------------------------------------------------
// YdEntityCard
// ---------------------------------------------------------------------------

const cardMeta: Meta<typeof YdEntityCard> = {
  title: 'Components/EntityCard',
  component: YdEntityCard,
  tags: ['autodocs'],
  argTypes: {
    avatarText: { control: 'text', description: '头像文案（显示首字母）' },
    avatarVariant: {
      control: 'select',
      options: ['primary', 'purple', 'orange', 'red', 'blue', 'green', 'neutral'],
      description: '头像背景色语义',
    },
    clickable: { control: 'boolean', description: '卡片主体是否可点击' },
    code: { control: 'text', description: '实体编码/副标题' },
    description: { control: 'text', description: '描述文本（单行截断）' },
    selectable: { control: 'boolean', description: '是否显示多选框' },
    selected: { control: 'boolean', description: '当前是否选中' },
  },
  parameters: {
    docs: {
      description: {
        component: 'YdEntityCard —— 业务实体卡片，用于卡片网格视图下展示业务对象。',
      },
    },
  },
};

export default cardMeta;
type Story = StoryObj<typeof YdEntityCard>;

/** 默认卡片 */
export const Default: Story = {
  args: {
    avatarText: '智能客服 Agent',
    avatarVariant: 'primary',
    code: 'AGT-001',
    description: '处理用户常见问题咨询，支持多渠道接入与自动学习',
    clickable: true,
  },
  render: (args) => ({
    components: { YdEntityCard },
    setup() { return { args } },
    template: '<YdEntityCard v-bind="args" />',
  }),
};

/** 紫色图标 */
export const PurpleAvatar: Story = {
  ...Default,
  args: {
    avatarText: '推荐模型',
    avatarVariant: 'purple',
    code: 'MDL-R1',
    description: '用于个性化内容推荐的深度学习模型',
    clickable: true,
  },
};

/** 绿色图标 */
export const GreenAvatar: Story = {
  ...Default,
  args: {
    avatarText: '审核流程',
    avatarVariant: 'green',
    code: 'WF-2024',
    description: '内容安全审核流程，支持多策略组合',
    clickable: true,
  },
};

/** 带多选框 */
export const Selectable: Story = {
  args: {
    avatarText: '批量操作示例',
    avatarVariant: 'neutral',
    code: 'BAT-999',
    description: '右上角 hover 出现多选框，支持批量操作',
    selectable: true,
    clickable: false,
  },
  render: (args) => ({
    components: { YdEntityCard },
    setup() { return { args } },
    template: '<YdEntityCard v-bind="args" />',
  }),
};

/** 已选中态 */
export const Selected: Story = {
  args: {
    avatarText: '已选卡片',
    avatarVariant: 'blue',
    code: 'Sel-001',
    description: '当前处于选中状态，显示 ring 高亮',
    selectable: true,
    selected: true,
    clickable: false,
  },
  render: (args) => ({
    components: { YdEntityCard },
    setup() { return { args } },
    template: '<YdEntityCard v-bind="args" />',
  }),
};

// ---------------------------------------------------------------------------
// YdCardGrid
// ---------------------------------------------------------------------------

const sampleCards = [
  { title: '智能客服', code: 'AGT-001', description: '处理用户常见问题', variant: 'primary' as const },
  { title: '推荐模型', code: 'MDL-R1', description: '个性化推荐引擎', variant: 'purple' as const },
  { title: '审核流程', code: 'WF-2024', description: '内容安全审核', variant: 'green' as const },
  { title: '知识库', code: 'KB-102', description: 'FAQ 与文档检索', variant: 'orange' as const },
  { title: '对话分析', code: 'ANL-007', description: '满意度与意图分析', variant: 'blue' as const },
  { title: '批量任务', code: 'BAT-999', description: '异步批量处理任务', variant: 'neutral' as const },
];

export const GridDefault: StoryObj<typeof YdCardGrid> = {
  render: () => ({
    components: { YdCardGrid, YdEntityCard },
    setup() {
      return { cards: sampleCards };
    },
    template: `
      <YdCardGrid>
        <YdEntityCard
          v-for="card in cards"
          :key="card.code"
          :avatar-text="card.title"
          :avatar-variant="card.variant"
          :code="card.code"
          :description="card.description"
        />
      </YdCardGrid>
    `,
  }),
};
