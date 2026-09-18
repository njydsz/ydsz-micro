/**
 * YdDataTable 组件 Stories —— 展示数据表格的排序/筛选/选择/汇总场景。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\data-table\YdDataTable.stories.ts
 * @author ydsz-team
 * @since 5.6.0
 */

import type { Meta, StoryObj } from '@storybook/vue3';

import YdDataTable from './YdDataTable.vue';

import type { TableColumnDef } from '../../composables/use-table-data';

/** 用户信息行 */
interface UserRow extends Record<string, unknown> {
  age: number;
  id: string;
  name: string;
  status: string;
}

const sampleData: UserRow[] = [
  { age: 30, id: '1', name: 'Alice', status: 'active' },
  { age: 25, id: '2', name: 'Bob', status: 'inactive' },
  { age: 35, id: '3', name: 'Carol', status: 'active' },
  { age: 28, id: '4', name: 'David', status: 'pending' },
  { age: 42, id: '5', name: 'Eve', status: 'active' },
];

const columns: TableColumnDef<UserRow>[] = [
  { key: 'name', isSortable: true },
  {
    filterMethod: (value, row) => row.status === value,
    filters: [
      { text: 'Active', value: 'active' },
      { text: 'Inactive', value: 'inactive' },
      { text: 'Pending', value: 'pending' },
    ],
    isFilterable: true,
    isSortable: true,
    key: 'age',
  },
  {
    filterMethod: (value, row) => row.status === value,
    filters: [
      { text: 'Active', value: 'active' },
      { text: 'Inactive', value: 'inactive' },
      { text: 'Pending', value: 'pending' },
    ],
    isFilterable: true,
    key: 'status',
  },
];

const meta: Meta<typeof YdDataTable> = {
  title: 'Components/YdDataTable',
  component: YdDataTable,
  tags: ['autodocs'],
  argTypes: {
    dataSource: { control: 'object', description: '数据源' },
    isSelectable: { control: 'boolean', description: '开启行选择' },
    isRemote: { control: 'boolean', description: '远程模式（关闭本地排序/筛选）' },
    selectType: { control: 'select', options: ['checkbox', 'radio'] },
  },
  parameters: {
    docs: {
      description: {
        component: 'YdDataTable —— 集成排序/筛选/行选择/树形/汇总的数据表格组件',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof YdDataTable>;

/** 基础表格 */
export const Default: Story = {
  render: () => ({
    components: { YdDataTable },
    setup() {
      return { columns, data: sampleData };
    },
    template: '<YdDataTable :data-source="data" :columns="columns" />',
  }),
};

/** 带行选择 */
export const Selectable: Story = {
  render: () => ({
    components: { YdDataTable },
    setup() {
      return { columns, data: sampleData };
    },
    template: '<YdDataTable :data-source="data" :columns="columns" is-selectable />',
  }),
};

/** 单选模式 */
export const RadioSelect: Story = {
  render: () => ({
    components: { YdDataTable },
    setup() {
      return { columns, data: sampleData };
    },
    template: '<YdDataTable :data-source="data" :columns="columns" is-selectable select-type="radio" />',
  }),
};

/** 远程模式 */
export const Remote: Story = {
  render: () => ({
    components: { YdDataTable },
    setup() {
      return { columns, data: sampleData };
    },
    template: '<YdDataTable :data-source="data" :columns="columns" is-remote />',
  }),
};
