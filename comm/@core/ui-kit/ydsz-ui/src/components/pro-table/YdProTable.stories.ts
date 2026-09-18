/**
 * YdProTable Stories —— 一体化 CRUD 表格场景演示。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\pro-table\YdProTable.stories.ts
 * @author ydsz-team
 * @since 5.6.0
 */

import type { Meta, StoryObj } from '@storybook/vue3';

import YdProTable from './YdProTable.vue';

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
  { key: 'id' },
  { key: 'name', isSortable: true },
  {
    key: 'age',
    isSortable: true,
  },
  {
    key: 'status',
    isFilterable: true,
    filters: [
      { text: 'Active', value: 'active' },
      { text: 'Inactive', value: 'inactive' },
      { text: 'Pending', value: 'pending' },
    ],
    filterMethod: (value, row) => row.status === value,
  },
];

const pagination = { current: 1, pageSize: 10, total: 100 };

const meta: Meta<typeof YdProTable> = {
  title: 'Components/YdProTable',
  component: YdProTable,
  tags: ['autodocs'],
  argTypes: {
    dataSource: { control: 'object', description: '数据源' },
    isLoading: { control: 'boolean', description: '加载状态' },
    pagination: { control: 'object', description: '分页配置' },
    rowSelection: { control: 'object', description: '行选择配置' },
  },
  parameters: {
    docs: {
      description: {
        component: 'YdProTable —— 集成搜索栏 + 工具栏 + 数据表格 + 分页的一体化 CRUD 组件',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof YdProTable>;

/** 基础表格（含排序/筛选/分页） */
export const Default: Story = {
  render: () => ({
    components: { YdProTable },
    setup() {
      return { columns, data: sampleData, pagination };
    },
    template: `
      <YdProTable
        :data-source="data"
        :columns="columns"
        :pagination="pagination"
        :row-key="(row) => row.id"
      />
    `,
  }),
};

/** 带行选择 */
export const Selectable: Story = {
  render: () => ({
    components: { YdProTable },
    setup() {
      return { columns, data: sampleData, pagination };
    },
    template: `
      <YdProTable
        :data-source="data"
        :columns="columns"
        :pagination="pagination"
        :row-key="(row) => row.id"
        :row-selection="{ type: 'checkbox' }"
      />
    `,
  }),
};

/** 工具栏 + 搜索插槽 */
export const WithToolbar: Story = {
  render: () => ({
    components: { YdProTable },
    setup() {
      return { columns, data: sampleData, pagination };
    },
    template: `
      <YdProTable
        :data-source="data"
        :columns="columns"
        :pagination="pagination"
        :row-key="(row) => row.id"
        :row-selection="{ type: 'checkbox' }"
      >
        <template #toolbar>
          <div class="flex gap-2">
            <button class="rounded bg-primary px-3 py-1 text-sm text-white">新增</button>
            <button class="rounded border px-3 py-1 text-sm">批量删除</button>
            <button class="rounded border px-3 py-1 text-sm">导出</button>
          </div>
        </template>
        <template #search>
          <div class="flex gap-2">
            <input class="rounded border px-2 py-1 text-sm" placeholder="搜索姓名" />
            <button class="rounded bg-primary px-3 py-1 text-sm text-white">查询</button>
            <button class="rounded border px-3 py-1 text-sm">重置</button>
          </div>
        </template>
      </YdProTable>
    `,
  }),
};
