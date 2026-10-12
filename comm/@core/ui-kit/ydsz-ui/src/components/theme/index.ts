/**
 * 运行时主题系统出口集合。
 *
 * <p>包含：
 * <ul>
 *   <li>theme-schema.ts —— 三层 Token 注册表（base / semantic / component）</li>
 *   <li>useTheme —— 核心 composable：作用域主题句柄 + preset 注册</li>
 *   <li>useThemeContext —— 注入点读取：从 ThemeProvider 获取句柄或回退全局</li>
 *   <li>ThemeProvider —— Vue 组件包裹器：provide + 系统 prefers-color-scheme 监听 + density</li>
 *   <li>tokens-base.ts —— 设计侧原始色阶（50~950）</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\theme\index.ts
 * @author ydsz-team
 * @since 5.6.0
 */

export {
  themeTokens,
  tokensByCategory,
  tokensByLayer,
  TokenCategory,
  TokenLayer,
} from './theme-schema';
export type {
  TokenDefinition,
  TokenName,
  TokenCategoryType,
  TokenLayerType,
} from './theme-schema';

export { useTheme, getTheme, registerPreset } from './use-theme';
export type {
  ThemePreset,
  ThemeOverrides,
  ThemeHandle,
  PresetRegistry,
} from './use-theme';

export { useThemeContext } from './use-theme-context';
export { ThemeProvider, THEME_INJECTION_KEY } from './ThemeProvider.vue';
export { default as YdThemeScope } from './YdThemeScope.vue';
export type { ThemeMode } from './YdThemeScope.vue';

export { baseTokens } from './tokens-base';
export type { BaseTokenName } from './tokens-base';
