/**
 * YDSZ 公共组件 Storybook 示例 — Loading 组件
 *
 * P2-3: Storybook 组件文档
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { Meta, StoryObj } from '@storybook/vue3';

import Loading from '../loading.vue';

const meta: Meta<typeof Loading> = {
  title: 'Common/Loading',
  component: Loading,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'default', 'large'],
    },
    text: {
      control: 'text',
    },
  },
};

/**
 * Storybook 默认导出：Loading 组件的 story 集合元数据。
 *
 * 必须作为本模块的 default 导出，Storybook 依据 `title` 决定侧边栏层级
 * （此处落到 `Common/Loading`），并依据 `component` 自动推断 props 表格。
 * `tags: ['autodocs']` 让文档页自动生成，省去手写 Docs 页。
 */
export default meta;
type Story = StoryObj<typeof Loading>;

/** 默认尺寸的加载示例 */
export const Default: Story = {
  args: {
    size: 'default',
    text: '加载中...',
  },
};

/** 小尺寸的加载示例 */
export const Small: Story = {
  args: {
    size: 'small',
    text: '加载中...',
  },
};

/** 大尺寸的加载示例 */
export const Large: Story = {
  args: {
    size: 'large',
    text: '加载中...',
  },
};

/** 不展示文字提示、仅保留加载图标的示例 */
export const WithoutText: Story = {
  args: {
    size: 'default',
    text: '',
  },
};
