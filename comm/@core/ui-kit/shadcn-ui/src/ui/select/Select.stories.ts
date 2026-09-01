/**
 * Select 组件 Storybook Stories
 *
 * P1-2.3: 组件文档化 — Select 组件交互式文档
 *
 * @path comm/@core/ui-kit/shadcn-ui/src/ui/select/Select.stories.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { Meta, StoryObj } from '@storybook/vue3';

import { ref } from 'vue';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './index';

const meta: Meta = {
  title: 'Core/Select',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: '选择器组件用于从预定义选项列表中选择一个或多个值，支持分组和分隔线。',
      },
    },
  },
};

/**
 * Select 组件示例集的 Storybook 元信息。
 *
 * 覆盖的状态：
 *  - `Default`：扁平选项列表的基础选择器；
 *  - `WithGroups`：用 `SelectGroup` + `SelectLabel` + `SelectSeparator` 做分组与分隔，
 *    验证长列表下的分组标题吸附与滚动区域高度；
 *  - `Disabled`：整控件禁用，验证 Trigger 的禁用样式与下拉不可展开；
 *  - `WithDefaultValue`：预设选中值，验证 `SelectValue` 在未选择时显示 placeholder、
 *    已选择时回显选中项文案的两种渲染分支；
 *  - `MultipleSelects`：多个选择器并置，用于暴露 z-index 与浮层定位在相邻控件间的遮挡问题。
 */
export default meta;
type Story = StoryObj;

/** 基础选择器 */
export const Default: Story = {
  render: () => ({
    components: { Select, SelectTrigger, SelectValue, SelectContent, SelectItem },
    setup() {
      const value = ref('');
      return { value };
    },
    template: `
      <Select v-model="value">
        <SelectTrigger style="width: 280px;">
          <SelectValue placeholder="请选择一个选项" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">苹果</SelectItem>
          <SelectItem value="banana">香蕉</SelectItem>
          <SelectItem value="orange">橙子</SelectItem>
          <SelectItem value="grape">葡萄</SelectItem>
        </SelectContent>
      </Select>
    `,
  }),
};

/** 带分组的选择器 */
export const WithGroups: Story = {
  render: () => ({
    components: {
      Select,
      SelectTrigger,
      SelectValue,
      SelectContent,
      SelectGroup,
      SelectLabel,
      SelectItem,
      SelectSeparator,
    },
    setup() {
      const value = ref('');
      return { value };
    },
    template: `
      <Select v-model="value">
        <SelectTrigger style="width: 280px;">
          <SelectValue placeholder="请选择水果" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>热带水果</SelectLabel>
            <SelectItem value="banana">香蕉</SelectItem>
            <SelectItem value="mango">芒果</SelectItem>
            <SelectItem value="pineapple">菠萝</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>温带水果</SelectLabel>
            <SelectItem value="apple">苹果</SelectItem>
            <SelectItem value="pear">梨</SelectItem>
            <SelectItem value="orange">橙子</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    `,
  }),
};

/** 禁用状态 */
export const Disabled: Story = {
  render: () => ({
    components: { Select, SelectTrigger, SelectValue, SelectContent, SelectItem },
    setup() {
      const value = ref('apple');
      return { value };
    },
    template: `
      <Select v-model="value" disabled>
        <SelectTrigger style="width: 280px;">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">苹果</SelectItem>
          <SelectItem value="banana">香蕉</SelectItem>
        </SelectContent>
      </Select>
    `,
  }),
};

/** 带默认值 */
export const WithDefaultValue: Story = {
  render: () => ({
    components: { Select, SelectTrigger, SelectValue, SelectContent, SelectItem },
    setup() {
      const value = ref('banana');
      return { value };
    },
    template: `
      <Select v-model="value">
        <SelectTrigger style="width: 280px;">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">苹果</SelectItem>
          <SelectItem value="banana">香蕉</SelectItem>
          <SelectItem value="orange">橙子</SelectItem>
        </SelectContent>
      </Select>
    `,
  }),
};

/** 多选择器展示 */
export const MultipleSelects: Story = {
  render: () => ({
    components: { Select, SelectTrigger, SelectValue, SelectContent, SelectItem },
    setup() {
      const fruit = ref('');
      const color = ref('');
      const size = ref('');
      return { fruit, color, size };
    },
    template: `
      <div style="display: flex; gap: 16px; flex-wrap: wrap;">
        <Select v-model="fruit">
          <SelectTrigger style="width: 200px;">
            <SelectValue placeholder="选择水果" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="apple">苹果</SelectItem>
            <SelectItem value="banana">香蕉</SelectItem>
            <SelectItem value="orange">橙子</SelectItem>
          </SelectContent>
        </Select>

        <Select v-model="color">
          <SelectTrigger style="width: 200px;">
            <SelectValue placeholder="选择颜色" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="red">红色</SelectItem>
            <SelectItem value="green">绿色</SelectItem>
            <SelectItem value="blue">蓝色</SelectItem>
          </SelectContent>
        </Select>

        <Select v-model="size">
          <SelectTrigger style="width: 200px;">
            <SelectValue placeholder="选择尺寸" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="small">小</SelectItem>
            <SelectItem value="medium">中</SelectItem>
            <SelectItem value="large">大</SelectItem>
          </SelectContent>
        </Select>
      </div>
    `,
  }),
};
