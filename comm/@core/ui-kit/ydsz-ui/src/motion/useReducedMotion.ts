/**
 * useReducedMotion composable —— 响应式追踪 prefers-reduced-motion 设置。
 *
 * @path comm/@core/ui-kit/ydsz-ui/src/motion/useReducedMotion.ts
 * @since 26.10.10
 */

import { onBeforeUnmount, readonly, ref, type Ref } from 'vue'

import { prefersReducedMotion } from './motion-tokens'

/**
 * 全局响应式的 prefers-reduced-motion 状态。
 * 在组件 setup 中调用 `const reduced = useReducedMotion()` 即可使用。
 *
 * 示例:
 * ```vue
 * <script setup>
 * const { reduced } = useReducedMotion()
 * </script>
 * <template>
 *   <div :style="{ transition: reduced.value ? 'none' : 'all 200ms' }" />
 * </template>
 * ```
 */
export function useReducedMotion(): {
  reduced: Readonly<Ref<boolean>>
} {
  const reduced = ref(prefersReducedMotion())

  let mql: MediaQueryList | undefined

  if (typeof window !== 'undefined') {
    mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => {
      reduced.value = e.matches
    }
    if (mql.addEventListener) {
      mql.addEventListener('change', handler)
    } else {
      mql.addListener(handler)
    }
  }

  onBeforeUnmount(() => {
    if (mql && mql.removeEventListener) {
      mql.removeEventListener('change', () => {})
    }
  })

  return { reduced: readonly(reduced) }
}
