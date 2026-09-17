/**
 * useThemeContext —— 从当前注入点获取主题句柄；未包裹 ThemeProvider 时回退到全局单例。
 *
 * 设计目标：
 *  - 下游组件用 `const theme = useThemeContext()` 一行获取操作入口；
 *  - ThemeProvider 存在时使用注入句柄，否则回退到全局默认句柄；
 *  - SSR 安全：globalThis.document 不可用时只返回 set/bulk no-op。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\theme\use-theme-context.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { inject } from 'vue';

import { getTheme } from './use-theme';
import { THEME_INJECTION_KEY } from './ThemeProvider.vue';

import type { ThemeHandle } from './use-theme';

/**
 * 获取当前主题句柄。
 *
 * @param fallbackToGlobal - 是否在无注入时回退全局单例，默认 true
 * @return 主题句柄
 *
 * @example
 * ```vue
 * <script setup>
 * const theme = useThemeContext();
 * function onToggle() {
 *   theme.toggleDark();
 * }
 * </script>
 * ```
 */
export function useThemeContext(fallbackToGlobal = true): ThemeHandle {
  const injected = inject<ThemeHandle | null>(THEME_INJECTION_KEY, null);
  if (injected) {
    return injected;
  }
  if (fallbackToGlobal) {
    return getTheme();
  }
  // 无注入也不回退时返回 no-op（SSR 兜底）
  return {
    applyPreset: () => {},
    bulk: () => {},
    get: () => null,
    isDark: () => false,
    overrideCount: () => 0,
    reset: () => {},
    set: () => {},
    target: () => ({}) as ThemeHandle,
    toggleDark: () => {},
  };
}
