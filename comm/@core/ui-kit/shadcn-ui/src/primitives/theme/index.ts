/**
 * 运行时主题系统出口集合。
 *
 * <p>包含：
 * <ul>
 *   <li>theme-schema.ts —— 类型安全的 CSS 变量注册表（所有 token 的元数据）</li>
 *   <li>useTheme —— 核心 composable：创建作用域限定的主题句柄</li>
 *   <li>useThemeContext —— 注入点读取：从 ThemeProvider 获取句柄或回退全局</li>
 *   <li>ThemeProvider —— Vue 组件包裹器：provide 注入 + 系统 prefers-color-scheme 监听</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\theme\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { themeTokens, tokensByCategory } from './theme-schema';
export type {
  TokenDefinition,
  TokenName,
  TokenCategoryType,
} from './theme-schema';

export { useTheme, getTheme } from './use-theme';
export type {
  ThemePreset,
  ThemeConfig,
  ThemeHandle,
  PresetRegistry,
} from './use-theme';

export { useThemeContext } from './use-theme-context';
export { ThemeProvider, THEME_INJECTION_KEY } from './ThemeProvider.vue';
