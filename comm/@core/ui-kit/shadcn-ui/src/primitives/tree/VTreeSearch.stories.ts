/**
 * YdVTreeSearch 组件 Storybook Stories
 *
 * P0-2: 带搜索过滤的树选择组件 — Storybook 交互式文档。
 *
 * @path comm\@core\ui-kit\shadcn-ui/src/ui/tree/YdVTreeSearch.stories.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { Meta, StoryObj } from '@storybook/vue3';

import { ref } from 'vue';

import YdVTreeSearch from './YdVTreeSearch.vue';

interface TreeNode {
  children?: TreeNode[];
  label: string;
  value: string;
}

const sampleTree: TreeNode[] = [
  {
    children: [
      { label: '前端开发', value: 'fe-dev' },
      { label: '前端架构', value: 'fe-arch' },
      {
        children: [
          { label: 'React 高级', value: 'react-advanced' },
          { label: 'Vue 源码', value: 'vue-source' },
        ],
        label: '前端框架',
        value: 'fe-framework',
      },
    ],
    label: '技术部',
    value: 'tech',
  },
  {
    children: [
      { label: 'UI 设计', value: 'ui-design' },
      { label: 'UX 研究', value: 'ux-research' },
    ],
    label: '设计部',
    value: 'design',
  },
  {
    children: [
      { label: 'DevOps 工程', value: 'devops' },
      { label: '数据平台', value: 'data-platform' },
    ],
    label: '运维部',
    value: 'ops',
  },
];

const meta: Meta<typeof YdVTreeSearch> = {
  title: 'Core/YdVTreeSearch',
  component: YdVTreeSearch,
  tags: ['autodocs'],
  argTypes: {
    searchPlaceholder: { control: 'text', description: '搜索框占位符' },
    highlightMatch: { control: 'boolean', description: '是否高亮匹配文本' },
    caseSensitive: { control: 'boolean', description: '大小写敏感' },
  },
  parameters: {
    docs: { description: { component: '带搜索过滤的树选择组件。' } },
  },
};

export default meta;
type Story = StoryObj<typeof YdVTreeSearch<TreeNode>>;

/** 默认树搜索 */
export const Default: Story = {
  render: () => ({
    components: { YdVTreeSearch },
    setup() {
      const treeData = ref(sampleTree);
      function onSelect(value: string | number): void {
        // eslint-disable-next-line no-console
        console.log('选中:', value);
      }
      return { onSelect, treeData };
    },
    template: `
      <div style="width: 320px;">
        <YdVTreeSearch :tree-data="treeData" @select="onSelect" />
      </div>
    `,
  }),
};

/** 自定义搜索占位符与大小写敏感 */
export const CaseSensitive: Story = {
  render: () => ({
    components: { YdVTreeSearch },
    setup: () => ({ treeData: ref(sampleTree) }),
    template: `
      <div style="width: 320px;">
        <YdVTreeSearch
          :tree-data="treeData"
          search-placeholder="搜索部门..."
          :case-sensitive="true"
        />
      </div>
    `,
  }),
};
