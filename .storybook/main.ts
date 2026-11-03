/**
 * Storybook 主配置 — ydsz-ui / ydsz-vue 组件可视化开发环境。
 *
 * @path .storybook\main.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { StorybookConfig } from '@storybook/vue3-vite';

const config: StorybookConfig = {
  stories: [
    '../comm/@core/ui-kit/ydsz-ui/src/**/*.stories.@(ts|tsx)',
    '../comm/@core/ui-kit/ydsz-vue/src/**/*.story.@(vue)',
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/vue3-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  typescript: {
    check: false,
    reactDocgen: 'vue-component-meta',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromUnion: true,
      shouldRemoveUndefinedFromOptional: true,
      propFilter: (prop) =>
        prop.parent ? !/node_modules/.test(prop.parent.fileName) : true,
    },
  },
};

export default config;
