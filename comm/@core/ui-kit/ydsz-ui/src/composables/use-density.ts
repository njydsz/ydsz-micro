/**
 * useDensity composable —— 消费全局密度档位，支持组件级覆盖。
 *
 * 对标 PrimeVue 三密度（compact / default / large）与 ANT compact 模式。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-density.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { inject, computed } from 'vue'

/** 组件密度档位 */
export type Density = 'compact' | 'default' | 'large'

/** useDensity 选项 */
export interface UseDensityOptions {
  /** 组件级覆盖（优先于全局） */
  size?: Density
}

/** 全局密度注入 key */
export const DENSITY_INJECTION_KEY = 'ydsz-density'

/**
 * 获取当前密度档位。
 *
 * 优先使用组件级 `size` 覆盖，否则回退到全局 YdConfigProvider 注入值，
 * 再无则返回 'default'。
 *
 * @param opts - 选项
 * @returns 计算属性，反映最终生效的密度
 *
 * @example
 * ```vue
 * <script setup>
 * const density = useDensity()
 * // 或组件级覆盖
 * const dense = useDensity({ size: 'compact' })
 * </script>
 * ```
 */
export function useDensity(opts: UseDensityOptions = {}) {
  const globalDensity = inject<Density>(DENSITY_INJECTION_KEY, 'default')
  return computed(() => opts.size ?? globalDensity)
}
