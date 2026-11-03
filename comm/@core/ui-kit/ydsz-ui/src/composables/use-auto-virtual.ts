/**
 * useAutoVirtual composable —— 根据数据量自动决定是否启用虚拟滚动。
 *
 * <p>对标 Naive UI 的全数据组件默认虚拟滚动策略：
 * 当数据量超过阈值时自动启用虚拟滚动，数据量较小时退化为普通渲染。
 *
 * <p>用法：
 * ```vue
 * <script setup>
 * const { shouldVirtualize, virtualizedProps } = useAutoVirtual(
 *   () => items.value.length,
 *   { threshold: 100, itemHeight: 32 },
 * );
 * </script>
 *
 * <template>
 *   <YdDataTable
 *     :virtual="shouldVirtualize"
 *     :virtual-height="virtualizedProps.virtualHeight"
 *   />
 * </template>
 * ```
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-auto-virtual.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { computed, type ComputedRef } from 'vue';

/** useAutoVirtual 配置 */
export interface UseAutoVirtualOptions {
  /**
   * 启用虚拟滚动的数据量阈值，默认 100。
   * 超过此值时自动启用虚拟滚动。
   */
  threshold?: number;
  /** 单行高度（像素），默认 32 */
  itemHeight?: number;
  /** 视口高度（像素），默认 300 */
  viewportHeight?: number;
  /**
   * 强制启用/禁用虚拟滚动（优先级高于阈值判断）。
   * 传 true 时始终启用，传 false 时始终禁用。
   */
  force?: boolean;
}

/** useAutoVirtual 返回结果 */
export interface AutoVirtualResult {
  /** 是否应启用虚拟滚动 */
  shouldVirtualize: ComputedRef<boolean>;
  /** 虚拟滚动配置 props（可直接绑定到组件） */
  virtualizedProps: ComputedRef<{
    virtual: boolean;
    virtualHeight: number;
    itemHeight: number;
  }>;
}

/**
 * 根据数据量自动决定是否启用虚拟滚动。
 *
 * @param itemCountRef - 数据量（ref 或 getter）
 * @param options - 配置项
 * @returns 虚拟滚动判断结果和配置 props
 *
 * @example
 * ```ts
 * const { shouldVirtualize, virtualizedProps } = useAutoVirtual(
 *   () => data.value.length,
 *   { threshold: 50, itemHeight: 36 },
 * );
 * ```
 */
export function useAutoVirtual(
  itemCountRef: () => number,
  options: UseAutoVirtualOptions = {},
): AutoVirtualResult {
  const {
    threshold = 100,
    itemHeight = 32,
    viewportHeight = 300,
    force,
  } = options;

  const shouldVirtualize = computed(() => {
    if (force !== undefined) return force;
    return itemCountRef() > threshold;
  });

  const virtualizedProps = computed(() => ({
    virtual: shouldVirtualize.value,
    virtualHeight: viewportHeight,
    itemHeight,
  }));

  return {
    shouldVirtualize,
    virtualizedProps,
  };
}
