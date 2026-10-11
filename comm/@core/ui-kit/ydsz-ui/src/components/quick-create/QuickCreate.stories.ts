/**
 * QuickCreate Stories —— YdQuickCreateButton 快捷创建悬浮按钮演练场。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\quick-create\QuickCreate.stories.ts
 * @author ydsz-team
 * @since 26.10.10
 */
import type { Meta, StoryObj } from '@storybook/vue3';

import { Bot, FileText, MessageSquare, Workflow } from 'lucide-vue-next';

import YdQuickCreateButton from './YdQuickCreateButton.vue';

import type { QuickCreateItem } from './YdQuickCreateButton.vue';

const meta: Meta<typeof YdQuickCreateButton> = {
  title: 'Components/QuickCreate',
  component: YdQuickCreateButton,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'orange', 'neutral'],
      description: '按钮颜色变体',
    },
    items: { control: 'object', description: '创建菜单项列表' },
  },
  parameters: {
    docs: {
      description: {
        component: 'YdQuickCreateButton —— 快捷创建悬浮按钮，点击展开创建菜单，支持 primary / orange / neutral 三种变体。',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof YdQuickCreateButton>;

const defaultItems: QuickCreateItem[] = [
  { key: 'agent', label: 'Agent', icon: Bot, description: '新建 AI Agent' },
  { key: 'flow', label: '流程', icon: Workflow, description: '创建业务流程' },
  { key: 'message', label: '消息批次', icon: MessageSquare, description: '批量消息管理' },
  { key: 'doc', label: '文档', icon: FileText, description: '上传或新建文档' },
];

/** 橙色变体（默认） */
export const Orange: Story = {
  render: () => ({
    components: { YdQuickCreateButton },
    setup() {
      return { items: defaultItems };
    },
    template: '<YdQuickCreateButton :items="items" variant="orange" />',
  }),
};

/** 主色变体 */
export const Primary: Story = {
  render: () => ({
    components: { YdQuickCreateButton },
    setup() {
      return { items: defaultItems };
    },
    template: '<YdQuickCreateButton :items="items" variant="primary" />',
  }),
};

/** 中性变体 */
export const Neutral: Story = {
  render: () => ({
    components: { YdQuickCreateButton },
    setup() {
      return { items: defaultItems };
    },
    template: '<YdQuickCreateButton :items="items" variant="neutral" />',
  }),
};

/** 少量菜单项 */
export const FewItems: Story = {
  render: () => ({
    components: { YdQuickCreateButton },
    setup() {
      const items: QuickCreateItem[] = [
        { key: 'agent', label: 'Agent', icon: Bot },
        { key: 'doc', label: '文档', icon: FileText },
      ];
      return { items };
    },
    template: '<YdQuickCreateButton :items="items" variant="primary" />',
  }),
};

/** 无描述 */
export const WithoutDescription: Story = {
  render: () => ({
    components: { YdQuickCreateButton },
    setup() {
      const items: QuickCreateItem[] = [
        { key: 'agent', label: 'Agent' },
        { key: 'flow', label: '流程' },
        { key: 'msg', label: '消息' },
      ];
      return { items };
    },
    template: '<YdQuickCreateButton :items="items" variant="orange" />',
  }),
};
