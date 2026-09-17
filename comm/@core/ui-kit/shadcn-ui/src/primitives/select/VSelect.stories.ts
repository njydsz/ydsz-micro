/**
 * YdVSelect 组件 Storybook Stories
 *
 * P0-1: 带虚拟滚动的高性能选择器 — Storybook 交互式文档。
 *
 * 覆盖的状态：
 *  - `Default`：10000 项大数据验证虚拟滚动流畅度；
 *  - `WithClearable`：带清除按钮；
 *  - `Disabled`：禁用态。
 *
 * @path comm/@core/ui-kit/ydsz-ui/src/ui/select/YdVSelect.stories.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { Meta, StoryObj } from '@storybook/vue3';

import { ref } from 'vue';

import type { VSelectProps } from './index';

import { YdVSelect } from './index';

const meta: Meta = {
  title: 'Core/YdVSelect',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '带虚拟滚动的高性能选择器，500+ 项大数据场景下保持渲染节点恒定。',
      },
    },
  },
};

/**
 * 生成大量测试数据：验证虚拟滚动在大数据场景下的性能。
 *
 * @param count - 数据条数
 * @return 结果数组
 */
function generateItems(
  count: number,
): Array<{ value: string; label: string }> {
  return Array.from({ length: count }, (_, i) => ({
    label: `选项 ${i + 1} —— 虚拟滚动数据项`,
    value: `item-${i + 1}`,
  }));
}

export default meta;
type Story = StoryObj;

/** 默认大数据选择器（10000 项） */
export const Default: Story = {
  render: () => {
    const value = ref<string | number | undefined>(undefined);
    const items = generateItems(10_000);
    return {
      components: { YdVSelect },
      setup() {
        const selectProps: VSelectProps<{
          value: string;
          label: string;
        }> = {
          allowClear: true,
          itemHeight: 36,
          items,
          keyField: 'value',
          labelField: 'label',
          overscan: 8,
          placeholder: '请选择一项（10000 项测试）',
          valueField: 'value',
          virtualThreshold: 100,
          viewportHeight: 240,
        };
        return { selectProps, value };
      },
      template: `
        <div style="padding: 200px 0;">
          <YdVSelect
            v-model="value"
            v-bind="selectProps"
            style="width: 320px;"
          />
          <p style="margin-top: 8px; font-size: 12px; color: #666;">当前选中: {{ value || '无' }}</p>
        </div>
      `,
    };
  },
};

/** 带清除按钮的默认选择器 */
export const WithClearable: Story = {
  render: () => {
    const value = ref<string | number | undefined>('item-50');
    const items = generateItems(500);
    return {
      components: { YdVSelect },
      setup() {
        const selectProps: VSelectProps<{
          value: string;
          label: string;
        }> = {
          allowClear: true,
          itemHeight: 36,
          items,
          keyField: 'value',
          labelField: 'label',
          overscan: 5,
          placeholder: '请选择一项',
          valueField: 'value',
          virtualThreshold: 100,
          viewportHeight: 200,
        };
        return { selectProps, value };
      },
      template: `
        <div style="padding: 200px 0;">
          <YdVSelect
            v-model="value"
            v-bind="selectProps"
            style="width: 280px;"
          />
        </div>
      `,
    };
  },
};

/** 禁用状态 */
export const Disabled: Story = {
  render: () => {
    const value = ref<string | number | undefined>(undefined);
    const items = generateItems(200);
    return {
      components: { YdVSelect },
      setup() {
        const selectProps: VSelectProps<{
          value: string;
          label: string;
        }> = {
          allowClear: true,
          disabled: true,
          itemHeight: 36,
          items,
          keyField: 'value',
          labelField: 'label',
          overscan: 5,
          placeholder: '已禁用',
          valueField: 'value',
          virtualThreshold: 100,
          viewportHeight: 200,
        };
        return { selectProps, value };
      },
      template: `
        <div style="padding: 200px 0;">
          <YdVSelect
            v-model="value"
            v-bind="selectProps"
            style="width: 280px;"
          />
        </div>
      `,
    };
  },
};

/** 小数据量回退原生渲染 */
export const SmallDataset: Story = {
  render: () => {
    const value = ref<string | number | undefined>(undefined);
    const items = generateItems(20);
    return {
      components: { YdVSelect },
      setup() {
        const selectProps: VSelectProps<{
          value: string;
          label: string;
        }> = {
          allowClear: true,
          itemHeight: 36,
          items,
          keyField: 'value',
          labelField: 'label',
          overscan: 5,
          placeholder: '请选择（< 100 项走原生渲染）',
          valueField: 'value',
          virtualThreshold: 100,
          viewportHeight: 200,
        };
        return { selectProps, value };
      },
      template: `
        <div style="padding: 200px 0;">
          <YdVSelect
            v-model="value"
            v-bind="selectProps"
            style="width: 280px;"
          />
          <p style="margin-top: 8px; font-size: 12px; color: #999;">数据量 20 < virtualThreshold 100，原生渲染</p>
        </div>
      `,
    };
  },
};
