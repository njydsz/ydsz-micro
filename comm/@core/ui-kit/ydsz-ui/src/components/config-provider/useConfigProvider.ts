/**
 * useConfigProvider composable —— 从当前注入点获取全局配置上下文，未包裹时回退到默认值。
 *
 * 设计目标：
 *  - 下游组件用 `const { size, locale } = useConfigProvider()` 解构使用；
 *  - YdConfigProvider 存在时使用注入上下文，否则回退到 DEFAULT_CONFIG；
 *  - 始终返回 safe 默认值，避免 undefined 引发的连锁错误。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\config-provider\useConfigProvider.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { inject } from 'vue';

import { CONFIG_INJECTION_KEY } from './YdConfigProvider.vue';

import type { ConfigContext } from './types';

/**
 * 默认全局配置上下文（无 YdConfigProvider 包裹时的安全回退）。
 *
 * @remarks 所有字段都带默认值，保证下游组件在任何场景下都可安全解构。
 */
const DEFAULT_CONFIG: ConfigContext = {
  density: 'default',
  isDisabled: false,
  locale: {},
  prefixCls: 'yd',
  renderEmpty: undefined,
  size: 'default',
  theme: { mode: 'auto', preset: 'light' },
  wave: { isDisabled: false },
};

/**
 * 获取当前全局配置上下文。
 *
 * @param fallbackToDefault - 是否在无注入时回退到 DEFAULT_CONFIG，默认 true
 * @return 配置上下文
 *
 * @example
 * ```vue
 * <script setup>
 * const { size, locale } = useConfigProvider();
 * </script>
 * ```
 *
 * @since 1.0.0
 */
export function useConfigProvider(fallbackToDefault = true): ConfigContext {
  const injected = inject<ConfigContext | null>(CONFIG_INJECTION_KEY, null);
  if (injected) {
    return injected;
  }
  if (fallbackToDefault) {
    return DEFAULT_CONFIG;
  }
  // 无注入且不允许回退——返回空结构，调用方需自行防御
  return {} as ConfigContext;
}
