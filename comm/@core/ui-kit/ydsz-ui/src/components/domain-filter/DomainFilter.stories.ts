/**
 * DomainFilter Stories —— YdDomainFilterPanel 业务域筛选面板演练场。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\domain-filter\DomainFilter.stories.ts
 * @author ydsz-team
 * @since 26.10.10
 */
import type { Meta, StoryObj } from '@storybook/vue3';

import YdDomainFilterPanel from './YdDomainFilterPanel.vue';

import type { DomainItem } from './YdDomainFilterPanel.vue';

const meta: Meta<typeof YdDomainFilterPanel> = {
  title: 'Components/DomainFilter',
  component: YdDomainFilterPanel,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text', description: '面板标题' },
    showSearch: { control: 'boolean', description: '是否显示搜索框' },
    showAdd: { control: 'boolean', description: '是否显示新建按钮' },
    addText: { control: 'text', description: '新建按钮文案' },
    bottomHint: { control: 'text', description: '底部提示文字' },
    items: { control: 'object', description: '域选项列表' },
  },
  parameters: {
    docs: {
      description: {
        component: 'YdDomainFilterPanel —— 左侧业务域/分类筛选面板，支持全选项 + N 个域选项 + 计数徽章。',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof YdDomainFilterPanel>;

const sampleDomains: DomainItem[] = [
  { code: 'customer-support', name: '客服域', count: 24, description: '客户咨询与工单' },
  { code: 'marketing', name: '营销域', count: 18, description: '活动与推广' },
  { code: 'risk-control', name: '风控域', count: 12, description: '风险识别与预警' },
  { code: 'product', name: '产品域', count: 35, description: '产品管理与发布' },
  { code: 'data', name: '数据域', count: 8, description: '数据分析与报表' },
  { code: 'infra', name: '基础设施域', count: 5, description: '服务运维与监控' },
];

/** 基础用法 */
export const Default: Story = {
  render: () => ({
    components: { YdDomainFilterPanel },
    setup() {
      return { items: sampleDomains };
    },
    template: '<YdDomainFilterPanel :items="items" style="height: 500px; width: 240px;" />',
  }),
};

/** 带新建按钮 */
export const WithAddButton: Story = {
  render: () => ({
    components: { YdDomainFilterPanel },
    setup() {
      return { items: sampleDomains };
    },
    template: '<YdDomainFilterPanel :items="items" show-add addText="新建域" style="height: 500px; width: 240px;" />',
  }),
};

/** 无搜索框 */
export const WithoutSearch: Story = {
  render: () => ({
    components: { YdDomainFilterPanel },
    setup() {
      return { items: sampleDomains };
    },
    template: '<YdDomainFilterPanel :items="items" :show-search="false" style="height: 500px; width: 240px;" />',
  }),
};

/** 自定义标题 */
export const CustomTitle: Story = {
  render: () => ({
    components: { YdDomainFilterPanel },
    setup() {
      const items: DomainItem[] = [
        { code: 'team-a', name: 'A 组空间', count: 10 },
        { code: 'team-b', name: 'B 组空间', count: 6 },
        { code: 'team-c', name: 'C 组空间', count: 3 },
      ];
      return { items };
    },
    template: '<YdDomainFilterPanel :items="items" title="空间" style="height: 400px; width: 240px;" />',
  }),
};

/** 带底部提示 */
export const WithBottomHint: Story = {
  render: () => ({
    components: { YdDomainFilterPanel },
    setup() {
      return { items: sampleDomains };
    },
    template: `
      <YdDomainFilterPanel
        :items="items"
        bottomHint="域变更后 5 分钟内生效"
        style="height: 500px; width: 240px;"
      />
    `,
  }),
};

/** 空列表 */
export const EmptyItems: Story = {
  render: () => ({
    components: { YdDomainFilterPanel },
    template: '<YdDomainFilterPanel :items="[]" style="height: 400px; width: 240px;" />',
  }),
};
