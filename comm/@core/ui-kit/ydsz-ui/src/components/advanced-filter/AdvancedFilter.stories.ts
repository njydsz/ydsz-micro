/**
 * AdvancedFilter Stories —— YdAdvancedFilterBar 高级筛选工具栏演练场。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\advanced-filter\AdvancedFilter.stories.ts
 * @author ydsz-team
 * @since 26.10.10
 */
import type { Meta, StoryObj } from '@storybook/vue3';

import YdAdvancedFilterBar from './YdAdvancedFilterBar.vue';

import type { FilterChip } from './YdAdvancedFilterBar.vue';

const meta: Meta<typeof YdAdvancedFilterBar> = {
  title: 'Components/AdvancedFilter',
  component: YdAdvancedFilterBar,
  tags: ['autodocs'],
  argTypes: {
    showSearch: { control: 'boolean', description: '是否显示搜索框' },
    filters: { control: 'object', description: '当前筛选 Chip 列表' },
    searchPlaceholder: { control: 'text', description: '搜索占位文本' },
    searchQuery: { control: 'text', description: '搜索词（v-model）' },
  },
  parameters: {
    docs: {
      description: {
        component: 'YdAdvancedFilterBar —— 高级筛选工具栏，以 Chip 展示已选筛选条件，支持搜索框与清空全部。',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof YdAdvancedFilterBar>;

const sampleFilters: FilterChip[] = [
  { field: 'status', value: '已发布', label: '状态', rawValue: 'published' },
  { field: 'type', value: '流程', label: '类型', rawValue: 'flow' },
  { field: 'owner', value: 'Alice', label: '负责人', rawValue: 'alice' },
];

/** 空状态（无筛选条件） */
export const Empty: Story = {
  render: () => ({
    components: { YdAdvancedFilterBar },
    template: '<YdAdvancedFilterBar :filters="[]" />',
  }),
};

/** 带筛选条件 */
export const WithFilters: Story = {
  render: () => ({
    components: { YdAdvancedFilterBar },
    setup() {
      return { filters: sampleFilters };
    },
    template: '<YdAdvancedFilterBar :filters="filters" />',
  }),
};

/** 无搜索框 */
export const WithoutSearch: Story = {
  render: () => ({
    components: { YdAdvancedFilterBar },
    setup() {
      return { filters: sampleFilters };
    },
    template: '<YdAdvancedFilterBar :filters="filters" :show-search="false" />',
  }),
};

/** 自定义占位文案 */
export const CustomPlaceholder: Story = {
  render: () => ({
    components: { YdAdvancedFilterBar },
    template: `
      <YdAdvancedFilterBar
        :filters="[]"
        search-placeholder="搜索 Agent、流程或文档..."
      />
    `,
  }),
};

/** 大量筛选条件 */
export const ManyFilters: Story = {
  render: () => ({
    components: { YdAdvancedFilterBar },
    setup() {
      const filters: FilterChip[] = [
        { field: 'status', value: '已发布', label: '状态', rawValue: 'published' },
        { field: 'type', value: '流程', label: '类型', rawValue: 'flow' },
        { field: 'owner', value: 'Alice', label: '负责人', rawValue: 'alice' },
        { field: 'env', value: '生产', label: '环境', rawValue: 'prod' },
        { field: 'tag', value: 'v2.0', label: '版本', rawValue: 'v2' },
      ];
      return { filters };
    },
    template: '<YdAdvancedFilterBar :filters="filters" />',
  }),
};
