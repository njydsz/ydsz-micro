/**
 * ConfigProvider 组件 barrel。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\config-provider\index.ts
 * @author ydsz-team
 * @since 26.09.24
 */
export { default as ydConfigProvider } from './config-provider.vue';
export type {
  ConfigProviderProps,
  ConfigProviderEmits,
  ConfigProviderTheme,
  LocaleLang,
  DensityMode,
} from './config-provider-types';

// merged from pre-refactor ui/ + primitives/ barrels
export { CONFIG_INJECTION_KEY } from './YdConfigProvider.vue';
export { default as YdConfigProvider } from './YdConfigProvider.vue';
export type { ConfigContext, Density, ComponentSize, LocaleConfig, WaveConfig, } from './types';
export { useConfigProvider } from './useConfigProvider';
