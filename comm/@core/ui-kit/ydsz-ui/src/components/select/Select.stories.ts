/**
 * Select Stories —— YdSelectSmart 业务下拉选择器演练场。
 *
 * 基础 primitive Select 的 stories 位于 primitives/select/；
 * 本文件覆盖业务复合层（components/）中 options 驱动的 YdSelectSmart。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\select\Select.stories.ts
 * @author ydsz-team
 * @since 26.10.10
 */
import type { Meta, StoryObj } from '@storybook/vue3';

import YdSelectSmart from './YdSelectSmart.vue';

const meta: Meta<typeof YdSelectSmart> = {
  title: 'Components/SelectSmart',
  component: YdSelectSmart,
  tags: ['autodocs'],
  argTypes: {
    allowClear: { control: 'boolean', description: '开启一键清空按钮' },
    placeholder: { control: 'text', description: '占位提示文本' },
    options: { control: 'object', description: '选项数组 { label, value }[]' },
  },
  parameters: {
    docs: {
      description: {
        component: 'YdSelectSmart —— 开箱即用下拉选择器，options 数组直驱，附带 v-model 与 allowClear。',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const statusOptions = [
  { label: '全部', value: 'all' },
  { label: '草稿', value: 'draft' },
  { label: '已发布', value: 'published' },
  { label: '有变更', value: 'dirty' },
  { label: '已下线', value: 'offline' },
];

/** 基础用法 */
export const Default: Story = {
  render: () => ({
    components: { YdSelectSmart },
    setup() {
      return { options: statusOptions };
    },
    template: '<YdSelectSmart :options="options" placeholder="请选择状态" />',
  }),
};

/** 带清空按钮 */
export const Clearable: Story = {
  render: () => ({
    components: { YdSelectSmart },
    setup() {
      return { options: statusOptions };
    },
    template: '<YdSelectSmart :options="options" allow-clear placeholder="可清空" />',
  }),
};

/** 预设选中值 */
export const WithValue: Story = {
  render: () => ({
    components: { YdSelectSmart },
    setup() {
      return { options: statusOptions, selected: 'published' };
    },
    template: '<YdSelectSmart :options="options" v-model="selected" allow-clear placeholder="请选择..." />',
  }),
};

/** 长选项列表 */
export const LongList: Story = {
  render: () => ({
    components: { YdSelectSmart },
    setup() {
      const longOptions = Array.from({ length: 20 }, (_, i) => ({
        label: `选项 ${i + 1}`,
        value: `opt-${i + 1}`,
      }));
      return { options: longOptions };
    },
    template: '<YdSelectSmart :options="options" placeholder="滚动查看..." />',
  }),
};

/** 自定义样式 */
export const CustomClass: Story = {
  render: () => ({
    components: { YdSelectSmart },
    setup() {
      return { options: statusOptions };
    },
    template: '<YdSelectSmart :options="options" class="w-64" placeholder="自定义宽度" />',
  }),
};
