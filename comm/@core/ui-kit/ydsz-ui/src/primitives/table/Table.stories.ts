/**
 * YdTable 组件 Storybook Stories。
 *
 * P0-3: 无障碍数据表格 — 语义化表格结构演示。
 *
 * 覆盖的状态：
 *  - `Default`：基础表头/行/单元格；
 *  - `WithFooter`：带汇总行；
 *  - `Empty`：空数据占位；
 *  - `SelectableRows`：可选中行。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\table\YdTable.stories.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { Meta, StoryObj } from '@storybook/vue3';

import { ref } from 'vue';

import {
  YdTable,
  YdTableBody,
  YdTableCaption,
  YdTableCell,
  YdTableEmpty,
  YdTableFooter,
  YdTableHead,
  YdTableHeader,
  YdTableRow,
} from './index';

const meta: Meta = {
  title: 'Core/YdTable',
  // cspell:disable-next-line
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '无障碍语义化表格组件，由 YdTable / Header / Body / Row / Cell / Head / Caption 组成。',
      },
    },
  },
};

/** 示例数据类型 */
interface UserData {
  amount: number;
  email: string;
  id: string;
  invoices: string;
  status: string;
}

const sampleData: UserData[] = [
  { amount: 100, email: 'example@gmail.com', id: 'm5gr84i9', invoices: 'Sent', status: 'Success' },
  // cspell:disable-next-line
  { amount: 200, email: 'ab@gmail.com', id: '3u1reuv4', invoices: 'Paid', status: 'Success' },
  { amount: 300, email: 'test@gmail.com', id: 'derv1ws0', invoices: 'Unpaid', status: 'Processing' },
  // cspell:disable-next-line
  { amount: 400, email: 'example@163.com', id: 'bhbheikc', invoices: 'Sent', status: 'Failed' },
  // cspell:disable-next-line
  { amount: 500, email: 'test@163.com', id: 'kweg12km', invoices: 'Pending', status: 'Success' },
];

export default meta;
type Story = StoryObj;

/** 基础表格 */
export const Default: Story = {
  render: () => ({
    components: { YdTable, YdTableBody, YdTableCaption, YdTableCell, YdTableHead, YdTableHeader, YdTableRow },
    setup() {
      return { sampleData };
    },
    template: `
      <YdTable>
        <YdTableCaption>A list of your recent invoices.</YdTableCaption>
        <YdTableHeader>
          <YdTableRow>
            <YdTableHead width="120px">Status</YdTableHead>
            <YdTableHead>Email</YdTableHead>
            <YdTableHead align="right">Amount</YdTableHead>
          </YdTableRow>
        </YdTableHeader>
        <YdTableBody>
          <YdTableRow v-for="row in sampleData" :key="row.id">
            <YdTableCell>{{ row.status }}</YdTableCell>
            <YdTableCell>{{ row.email }}</YdTableCell>
            <YdTableCell align="right">{{ row.amount }}</YdTableCell>
          </YdTableRow>
        </YdTableBody>
      </YdTable>
    `,
  }),
};

/** 带汇总行的表格 */
export const WithFooter: Story = {
  render: () => ({
    components: { YdTable, YdTableBody, YdTableCell, YdTableFooter, YdTableHead, YdTableHeader, YdTableRow },
    setup() {
      return { sampleData };
    },
    template: `
      <YdTable>
        <YdTableHeader>
          <YdTableRow>
            <YdTableHead>Email</YdTableHead>
            <YdTableHead align="right">Amount</YdTableHead>
          </YdTableRow>
        </YdTableHeader>
        <YdTableBody>
          <YdTableRow v-for="row in sampleData" :key="row.id">
            <YdTableCell>{{ row.email }}</YdTableCell>
            <YdTableCell align="right">{{ row.amount }}</YdTableCell>
          </YdTableRow>
        </YdTableBody>
        <YdTableFooter>
          <YdTableRow>
            <YdTableCell>Total</YdTableCell>
            <YdTableCell align="right" class="font-semibold">{{ sampleData.reduce((acc, r) => acc + r.amount, 0) }}</YdTableCell>
          </YdTableRow>
        </YdTableFooter>
      </YdTable>
    `,
  }),
};

/** 空数据 */
export const Empty: Story = {
  render: () => ({
    components: { YdTable, YdTableBody, YdTableCell, YdTableEmpty, YdTableHead, YdTableHeader, YdTableRow },
    template: `
      <YdTable>
        <YdTableHeader>
          <YdTableRow>
            <YdTableHead width="120px">Status</YdTableHead>
            <YdTableHead>Email</YdTableHead>
            <YdTableHead align="right">Amount</YdTableHead>
          </YdTableRow>
        </YdTableHeader>
        <YdTableBody>
          <YdTableEmpty :colspan="3" />
        </YdTableBody>
      </YdTable>
    `,
  }),
};

/** 可选中行 */
export const SelectableRows: Story = {
  render: () => ({
    components: { YdTable, YdTableBody, YdTableCell, YdTableHead, YdTableHeader, YdTableRow },
    setup() {
      const selected = ref<string[]>([]);
      function toggle(id: string): void {
        const i = selected.value.indexOf(id);
        if (i >= 0) selected.value.splice(i, 1);
        else selected.value.push(id);
      }
      return { sampleData, selected, toggle };
    },
    template: `
      <YdTable>
        <YdTableHeader>
          <YdTableRow>
            <YdTableHead>Selected</YdTableHead>
            <YdTableHead>Email</YdTableHead>
            <YdTableHead align="right">Amount</YdTableHead>
          </YdTableRow>
        </YdTableHeader>
        <YdTableBody>
          <YdTableRow
            v-for="row in sampleData"
            :key="row.id"
            :selected="selected.includes(row.id)"
            @click="toggle(row.id)"
          >
            <YdTableCell>{{ selected.includes(row.id) ? '✓' : '' }}</YdTableCell>
            <YdTableCell>{{ row.email }}</YdTableCell>
            <YdTableCell align="right">{{ row.amount }}</YdTableCell>
          </YdTableRow>
        </YdTableBody>
      </YdTable>
    `,
  }),
};
