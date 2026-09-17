/**
 * YdSelectBase 组件 Storybook Stories
 *
 * P1-2.3: 组件文档化 — YdSelectBase 组件交互式文档
 *
 * @path comm/@core/ui-kit/ydsz-ui/src/ui/select/YdSelectBase.stories.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { Meta, StoryObj } from '@storybook/vue3';

import { ref } from 'vue';

import {
  YdSelectBase,
  YdSelectContentBase,
  YdSelectGroupBase,
  YdSelectItemBase,
  YdSelectLabelBase,
  YdSelectSeparatorBase,
  YdSelectTriggerBase,
  YdSelectValueBase,
} from './index';

const meta: Meta = {
  title: 'Core/YdSelectBase',
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
 * YdSelectBase 组件示例集的 Storybook 元信息。
 *
 * 覆盖的状态：
 *  - `Default`：扁平选项列表的基础选择器；
 *  - `WithGroups`：用 `YdSelectGroupBase` + `YdSelectLabelBase` + `YdSelectSeparatorBase` 做分组与分隔，
 *    验证长列表下的分组标题吸附与滚动区域高度；
 *  - `Disabled`：整控件禁用，验证 Trigger 的禁用样式与下拉不可展开；
 *  - `WithDefaultValue`：预设选中值，验证 `YdSelectValueBase` 在未选择时显示 placeholder、
 *    已选择时回显选中项文案的两种渲染分支；
 *  - `MultipleSelects`：多个选择器并置，用于暴露 z-index 与浮层定位在相邻控件间的遮挡问题。
 */
export default meta;
type Story = StoryObj;

/** 基础选择器 */
export const Default: Story = {
  render: () => ({
    components: { YdSelectBase, YdSelectTriggerBase, YdSelectValueBase, YdSelectContentBase, YdSelectItemBase },
    setup() {
      const value = ref('');
      return { value };
    },
    template: `
      <YdSelectBase v-model="value">
        <YdSelectTriggerBase style="width: 280px;">
          <YdSelectValueBase placeholder="请选择一个选项" />
        </YdSelectTriggerBase>
        <YdSelectContentBase>
          <YdSelectItemBase value="apple">苹果</YdSelectItemBase>
          <YdSelectItemBase value="banana">香蕉</YdSelectItemBase>
          <YdSelectItemBase value="orange">橙子</YdSelectItemBase>
          <YdSelectItemBase value="grape">葡萄</YdSelectItemBase>
        </YdSelectContentBase>
      </YdSelectBase>
    `,
  }),
};

/** 带分组的选择器 */
export const WithGroups: Story = {
  render: () => ({
    components: {
      YdSelectBase,
      YdSelectTriggerBase,
      YdSelectValueBase,
      YdSelectContentBase,
      YdSelectGroupBase,
      YdSelectLabelBase,
      YdSelectItemBase,
      YdSelectSeparatorBase,
    },
    setup() {
      const value = ref('');
      return { value };
    },
    template: `
      <YdSelectBase v-model="value">
        <YdSelectTriggerBase style="width: 280px;">
          <YdSelectValueBase placeholder="请选择水果" />
        </YdSelectTriggerBase>
        <YdSelectContentBase>
          <YdSelectGroupBase>
            <YdSelectLabelBase>热带水果</YdSelectLabelBase>
            <YdSelectItemBase value="banana">香蕉</YdSelectItemBase>
            <YdSelectItemBase value="mango">芒果</YdSelectItemBase>
            <YdSelectItemBase value="pineapple">菠萝</YdSelectItemBase>
          </YdSelectGroupBase>
          <YdSelectSeparatorBase />
          <YdSelectGroupBase>
            <YdSelectLabelBase>温带水果</YdSelectLabelBase>
            <YdSelectItemBase value="apple">苹果</YdSelectItemBase>
            <YdSelectItemBase value="pear">梨</YdSelectItemBase>
            <YdSelectItemBase value="orange">橙子</YdSelectItemBase>
          </YdSelectGroupBase>
        </YdSelectContentBase>
      </YdSelectBase>
    `,
  }),
};

/** 禁用状态 */
export const Disabled: Story = {
  render: () => ({
    components: { YdSelectBase, YdSelectTriggerBase, YdSelectValueBase, YdSelectContentBase, YdSelectItemBase },
    setup() {
      const value = ref('apple');
      return { value };
    },
    template: `
      <YdSelectBase v-model="value" disabled>
        <YdSelectTriggerBase style="width: 280px;">
          <YdSelectValueBase />
        </YdSelectTriggerBase>
        <YdSelectContentBase>
          <YdSelectItemBase value="apple">苹果</YdSelectItemBase>
          <YdSelectItemBase value="banana">香蕉</YdSelectItemBase>
        </YdSelectContentBase>
      </YdSelectBase>
    `,
  }),
};

/** 带默认值 */
export const WithDefaultValue: Story = {
  render: () => ({
    components: { YdSelectBase, YdSelectTriggerBase, YdSelectValueBase, YdSelectContentBase, YdSelectItemBase },
    setup() {
      const value = ref('banana');
      return { value };
    },
    template: `
      <YdSelectBase v-model="value">
        <YdSelectTriggerBase style="width: 280px;">
          <YdSelectValueBase />
        </YdSelectTriggerBase>
        <YdSelectContentBase>
          <YdSelectItemBase value="apple">苹果</YdSelectItemBase>
          <YdSelectItemBase value="banana">香蕉</YdSelectItemBase>
          <YdSelectItemBase value="orange">橙子</YdSelectItemBase>
        </YdSelectContentBase>
      </YdSelectBase>
    `,
  }),
};

/** 多选择器展示 */
export const MultipleSelects: Story = {
  render: () => ({
    components: { YdSelectBase, YdSelectTriggerBase, YdSelectValueBase, YdSelectContentBase, YdSelectItemBase },
    setup() {
      const fruit = ref('');
      const color = ref('');
      const size = ref('');
      return { fruit, color, size };
    },
    template: `
      <div style="display: flex; gap: 16px; flex-wrap: wrap;">
        <YdSelectBase v-model="fruit">
          <YdSelectTriggerBase style="width: 200px;">
            <YdSelectValueBase placeholder="选择水果" />
          </YdSelectTriggerBase>
          <YdSelectContentBase>
            <YdSelectItemBase value="apple">苹果</YdSelectItemBase>
            <YdSelectItemBase value="banana">香蕉</YdSelectItemBase>
            <YdSelectItemBase value="orange">橙子</YdSelectItemBase>
          </YdSelectContentBase>
        </YdSelectBase>

        <YdSelectBase v-model="color">
          <YdSelectTriggerBase style="width: 200px;">
            <YdSelectValueBase placeholder="选择颜色" />
          </YdSelectTriggerBase>
          <YdSelectContentBase>
            <YdSelectItemBase value="red">红色</YdSelectItemBase>
            <YdSelectItemBase value="green">绿色</YdSelectItemBase>
            <YdSelectItemBase value="blue">蓝色</YdSelectItemBase>
          </YdSelectContentBase>
        </YdSelectBase>

        <YdSelectBase v-model="size">
          <YdSelectTriggerBase style="width: 200px;">
            <YdSelectValueBase placeholder="选择尺寸" />
          </YdSelectTriggerBase>
          <YdSelectContentBase>
            <YdSelectItemBase value="small">小</YdSelectItemBase>
            <YdSelectItemBase value="medium">中</YdSelectItemBase>
            <YdSelectItemBase value="large">大</YdSelectItemBase>
          </YdSelectContentBase>
        </YdSelectBase>
      </div>
    `,
  }),
};
