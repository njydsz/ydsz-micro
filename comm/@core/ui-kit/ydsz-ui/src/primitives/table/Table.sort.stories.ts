/**
 * YdTable 排序 Stories —— 演示列排序交互。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：可访问性演示。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\table\Table.sort.stories.ts
 * @author ydsz-team
 * @since 26.09.17
 */
import type { Meta, StoryObj } from '@storybook/vue3';

import { ref } from 'vue';

import { YdTable, YdTableColumn } from './index';

const meta: Meta = {
  tags: ['autodocs'],
  title: 'Core/YdTable/ColumnSorting',
};

interface DataRow {
  age: number;
  name: string;
}

const sampleData = ref<DataRow[]>([
  { age: 30, name: 'Alice' },
  { age: 25, name: 'Bob' },
  { age: 35, name: 'Charlie' },
]);

const sortProp = ref<string>('');
const sortOrder = ref<'asc' | 'desc' | null>(null);

/**
 * 处理排序变更（模拟服务端排序）。
 *
 * @param prop - 列 prop
 * @param order - 排序方向
 */
function handleSortChange(prop: string, order: 'asc' | 'desc' | null): void {
  sortProp.value = prop;
  sortOrder.value = order;

  if (!order) {
    sampleData.value = [
      { age: 30, name: 'Alice' },
      { age: 25, name: 'Bob' },
      { age: 35, name: 'Charlie' },
    ];
    return;
  }

  const sorted = [...sampleData.value].sort((a, b) => {
    const aVal = a[prop as keyof DataRow];
    const bVal = b[prop as keyof DataRow];
    const cmp = typeof aVal === 'number' ? aVal - (bVal as number) : String(aVal).localeCompare(String(bVal));
    return order === 'asc' ? cmp : -cmp;
  });
  sampleData.value = sorted;
}

export default meta;
type Story = StoryObj;

export const ColumnSorting: Story = {
  render: () => ({
    components: { YdTable, YdTableColumn },
    setup() {
      return { handleSortChange, sampleData, sortOrder, sortProp };
    },
    template: `
      <YdTable
        :data="sampleData"
        :sort-prop="sortProp"
        :sort-order="sortOrder"
        border
        @sort-change="handleSortChange"
      >
        <YdTableColumn prop="name" label="姓名" :is-sortable="true" min-width="120" />
        <YdTableColumn prop="age" label="年龄" :is-sortable="true" width="100" align="right" />
      </YdTable>
    `,
  }),
};
