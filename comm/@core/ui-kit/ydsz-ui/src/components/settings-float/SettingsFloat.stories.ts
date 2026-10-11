/**
 * SettingsFloat Stories —— YdSettingsFloatButton 全局设置悬浮按钮演练场。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\settings-float\SettingsFloat.stories.ts
 * @author ydsz-team
 * @since 26.10.10
 */
import type { Meta, StoryObj } from '@storybook/vue3';

import { FileText, Globe, LayoutGrid, Settings } from 'lucide-vue-next';

import YdSettingsFloatButton from './YdSettingsFloatButton.vue';

const meta: Meta<typeof YdSettingsFloatButton> = {
  title: 'Components/SettingsFloat',
  component: YdSettingsFloatButton,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'purple', 'neutral'],
      description: '按钮颜色变体',
    },
    actions: { control: 'object', description: '操作菜单项列表' },
  },
  parameters: {
    docs: {
      description: {
        component: 'YdSettingsFloatButton —— 全局设置悬浮按钮，固定于页面右下角，展开菜单含主题切换。',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof YdSettingsFloatButton>;

const defaultActions = [
  { key: 'theme', label: '主题设置', icon: Settings },
  { key: 'layout', label: '布局偏好', icon: LayoutGrid },
  { key: 'language', label: '中文简体', icon: Globe },
  { key: 'docs', label: '帮助文档', icon: FileText },
];

/** 主色变体 */
export const Primary: Story = {
  render: () => ({
    components: { YdSettingsFloatButton },
    setup() {
      return { actions: defaultActions };
    },
    template: '<YdSettingsFloatButton :actions="actions" variant="primary" />',
  }),
};

/** 紫色变体 */
export const Purple: Story = {
  render: () => ({
    components: { YdSettingsFloatButton },
    setup() {
      return { actions: defaultActions };
    },
    template: '<YdSettingsFloatButton :actions="actions" variant="purple" />',
  }),
};

/** 中性变体 */
export const Neutral: Story = {
  render: () => ({
    components: { YdSettingsFloatButton },
    setup() {
      return { actions: defaultActions };
    },
    template: '<YdSettingsFloatButton :actions="actions" variant="neutral" />',
  }),
};

/** 含危险操作 */
export const WithDanger: Story = {
  render: () => ({
    components: { YdSettingsFloatButton },
    setup() {
      const actions = [
        { key: 'theme', label: '主题设置', icon: Settings },
        { key: 'reset', label: '重置所有设置', icon: Settings, danger: true },
      ];
      return { actions };
    },
    template: '<YdSettingsFloatButton :actions="actions" variant="primary" />',
  }),
};

/** 空菜单 */
export const EmptyActions: Story = {
  render: () => ({
    components: { YdSettingsFloatButton },
    template: '<YdSettingsFloatButton variant="primary" />',
  }),
};
