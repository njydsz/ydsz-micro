/**
 * YdConfigProvider 组件 Storybook Stories。
 *
 * P0-1: 全局配置容器 —— 验证 theme / density / locale / isDisabled / renderEmpty 上下文注入。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\config-provider\ConfigProvider.stories.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { Meta, StoryObj } from '@storybook/vue3';

import YdConfigProvider from './YdConfigProvider.vue';

const meta: Meta<typeof YdConfigProvider> = {
  title: 'Core/YdConfigProvider',
  component: YdConfigProvider,
  tags: ['autodocs'],
  argTypes: {
    config: {
      control: 'object',
      description: '全局配置上下文对象',
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          '全局配置容器。包裹应用根节点后，下游组件通过 useConfigProvider() 获取 size、density、locale、theme 等统一上下文。',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof YdConfigProvider>;

/** 默认配置：无包裹，使用框架默认值 */
export const Default: Story = {
  render: () => ({
    components: { YdConfigProvider },
    template: `
      <div style="padding: 16px; border: 1px dashed #ccc;">
        <p style="color: hsl(var(--primary)); font-size: 14px;">
          默认 YdConfigProvider 包裹（未传 config，回退到 DEFAULT_CONFIG）。
        </p>
      </div>
    `,
  }),
};

/** 紧凑模式 */
export const Compact: Story = {
  render: (args) => ({
    components: { YdConfigProvider },
    setup() {
      return { args };
    },
    template: `
      <YdConfigProvider v-bind="args">
        <div style="padding: 8px;" data-density="compact">
          <p style="font-size: 12px;">紧凑density模式示例。</p>
        </div>
      </YdConfigProvider>
    `,
  }),
  args: {
    config: { density: 'compact', size: 'small' },
  },
};

/** 暗黑模式预览 */
export const DarkMode: Story = {
  render: (args) => ({
    components: { YdConfigProvider },
    setup() {
      return { args };
    },
    template: `
      <div style="background: hsl(var(--background)); padding: 16px;">
        <YdConfigProvider v-bind="args">
          <p style="color: hsl(var(--foreground));">暗黑主题下的文字。</p>
        </YdConfigProvider>
      </div>
    `,
  }),
  args: {
    config: { theme: { mode: 'dark', preset: 'dark' } },
  },
};

/** 禁用态 */
export const Disabled: Story = {
  render: (args) => ({
    components: { YdConfigProvider },
    setup() {
      return { args };
    },
    template: `
      <YdConfigProvider v-bind="args">
        <div style="padding: 16px;">
          <p>此区域所有交互组件被全局禁用。</p>
        </div>
      </YdConfigProvider>
    `,
  }),
  args: {
    config: { isDisabled: true },
  },
};

/** 自定义 locale */
export const CustomLocale: Story = {
  render: (args) => ({
    components: { YdConfigProvider },
    setup() {
      return { args };
    },
    template: `
      <YdConfigProvider v-bind="args">
        <p>当前 locale 传入：{{ JSON.stringify(args.config.locale) }}</p>
      </YdConfigProvider>
    `,
  }),
  args: {
    config: {
      locale: {
        'common.confirm': '确认',
        'common.cancel': '取消',
      },
    },
  },
};
