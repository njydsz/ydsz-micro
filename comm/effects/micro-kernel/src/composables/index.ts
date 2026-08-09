/**
 * micro-kernel 组合式函数出口
 *
 * @remarks
 * - useLocaleSync: 主子应用国际化运行时同步 composable
 * - useThemeSync: 主子应用主题运行时同步 composable
 *
 * @path comm/effects/micro-kernel/src/composables/index.ts
 * @author ydsz-team
 * @since 4.2.0
 */

export {
  onLocaleChange,
  registerLocaleProvider,
  useLocaleSync,
} from './use-locale-sync';
export type {
  UseLocaleSyncOptions,
  UseLocaleSyncReturn,
} from './use-locale-sync';
export {
  initThemeForSubApp,
  onThemeChange,
  registerThemeProvider,
  useThemeSync,
} from './use-theme-sync';
export type {
  ThemeMode,
  UseThemeSyncOptions,
  UseThemeSyncReturn,
} from './use-theme-sync';
