/**
 * Table 组件 Storybook Stories。
 *
 * P0-3: 无障碍数据表格 — 语义化表格结构演示。
 *
 * 覆盖的状态：
 *  - `Default`：基础表头/行/单元格；
 *  - `WithFooter`：带汇总行；
 *  - `Empty`：空数据占位；
 *  - `SelectableRows`：可选中行。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\table\Table.stories.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { Meta, StoryObj } from '@storybook/vue3';

import { ref } from 'vue';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableEmpty,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './index';

const meta: Meta = {
  title: 'Core/Table',
  // cspell:disable-next-line
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '无障碍语义化表格组件，由 Table / Header / Body / Row / Cell / Head / Caption 组成。',
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
    components: { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow },
    setup() {
      return { sampleData };
    },
    template: `
      <Table>
        <TableCaption>A list of your recent invoices.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead width="120px">Status</TableHead>
            <TableHead>Email</TableHead>
            <TableHead align="right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="row in sampleData" :key="row.id">
            <TableCell>{{ row.status }}</TableCell>
            <TableCell>{{ row.email }}</TableCell>
            <TableCell align="right">{{ row.amount }}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    `,
  }),
};

/** 带汇总行的表格 */
export const WithFooter: Story = {
  render: () => ({
    components: { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow },
    setup() {
      return { sampleData };
    },
    template: `
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead align="right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="row in sampleData" :key="row.id">
            <TableCell>{{ row.email }}</TableCell>
            <TableCell align="right">{{ row.amount }}</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Total</TableCell>
            <TableCell align="right" class="font-semibold">{{ sampleData.reduce((acc, r) => acc + r.amount, 0) }}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    `,
  }),
};

/** 空数据 */
export const Empty: Story = {
  render: () => ({
    components: { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow },
    template: `
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead width="120px">Status</TableHead>
            <TableHead>Email</TableHead>
            <TableHead align="right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableEmpty :colspan="3" />
        </TableBody>
      </Table>
    `,
  }),
};

/** 可选中行 */
export const SelectableRows: Story = {
  render: () => ({
    components: { Table, TableBody, TableCell, TableHead, TableHeader, TableRow },
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Selected</TableHead>
            <TableHead>Email</TableHead>
            <TableHead align="right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="row in sampleData"
            :key="row.id"
            :selected="selected.includes(row.id)"
            @click="toggle(row.id)"
          >
            <TableCell>{{ selected.includes(row.id) ? '✓' : '' }}</TableCell>
            <TableCell>{{ row.email }}</TableCell>
            <TableCell align="right">{{ row.amount }}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    `,
  }),
};
