/**
 * 轻量级虚拟化切换 composable —— 封装「数据量超过阈值时启用虚拟滚动」的判定逻辑。
 *
 * <p>设计定位：
 * <ul>
 *   <li>与 {@link useVirtualForList} 互补 —— 后者是全功能虚拟滚动控制器，
 *       本 composable 仅提供阈值判定 + 渲染项二选一，留给各组件更大的渲染自由度；</li>
 *   <li>与 {@link YdVirtualList} 配合 —— 让 Select / Transfer 等组件按需启用虚拟滚动，
 *       不在小数据量场景引入额外计算开销。</li>
 * </ul>
 *
 * <p>适用场景：
 *  - YdSelectSmart 下拉列表（见 {@link YdSelectSmart}）
 *  - YdTransfer 穿梭框左右列表
 *  - 任意需要「超过 N 项才启用虚拟滚动」的列表型组件
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-virtual-scroll-items.ts
 * @author ydsz-team
 * @since 26.10.15
 */

import type { Ref } from 'vue';

import { computed } from 'vue';

/** 虚拟化切换配置 */
export interface UseVirtualScrollItemsOptions {
  /**
   * 启用虚拟滚动的阈值。
   *
   * 当数据项数量超过此值时自动启用虚拟滚动以保障性能。
   * 设为 0 时恒不启用。
   * @default 100
   */
  threshold?: number;
}

/** 虚拟化切换返回句柄 */
export interface UseVirtualScrollItemsReturn<T> {
  /** 当前是否启用虚拟滚动 */
  enableVirtual: Ref<boolean>;
  /**
   * 当前应渲染的项。
   *
   * 未启用虚拟时返回全量 {@link T}，启用时返回 {@link VisibleItem}<{@link T}>，
   * 让模板用一个 v-for 走两种分支。
   */
  displayItems: Ref<T[] | VisibleItem<T>[]>;
}

/**
 * 可见项描述（精简版，避免对 use-virtual-list.ts 产生硬依赖时可直接用此类型）。
 *
 * 实际行为由组件内部使用的 useVirtualList 或 useVirtualForList 驱动，
 * 本 composable 仅做阈值判定与类型导出。
 */
export interface VisibleItem<T = unknown> {
  /** 原始数据项 */
  data: T;
  /** 在原始数组中的索引 */
  index: number;
  /** 该 item 相对列表顶部的偏移（像素） */
  offsetY: number;
  /** 该 item 的实际渲染高度 */
  height: number;
  /** 稳定的 key 标识 */
  key: string | number;
}

/**
 * 创建基于数据量的虚拟化切换控制器。
 *
 * 当 {@link items} 长度超过 {@link UseVirtualScrollItemsOptions.threshold} 时
 * 返回 {@link VisibleItem} 供模板以绝对定位渲染；否则直接返回原始数组走普通 v-for。
 *
 * @param items - 响应式数据源
 * @param options - 配置项（阈值等）
 * @returns 虚拟化切换句柄
 *
 * @example YdSelectSmart 场景：
 * ```vue
 * <script setup lang="ts">
 * const { enableVirtual, displayItems } = useVirtualScrollItems(
 *   () => filteredOptions,
 *   { virtualThreshold: 100 },
 * );
 * </script>
 *
 * <template>
 *   <YdVirtualList
 *     v-if="enableVirtual"
 *     :items="filteredOptions"
 *     :item-height="32"
 *     :scroll-height="256"
 *   >
 *     <template #default="{ items: vItems }">
 *       <div
 *         v-for="vItem in (vItems as VisibleItem<SmartOption>[])"
 *         :key="vItem.key"
 *         ...
 *       >
 *         {{ vItem.data.label }}
 *       </div>
 *     </template>
 *   </YdVirtualList>
 *
 *   <template v-else>
 *     <div v-for="(opt, idx) in (displayItems as SmartOption[])" :key="idx">
 *       {{ opt.label }}
 *     </div>
 *   </template>
 * </template>
 * ```
 */
export function useVirtualScrollItems<T = unknown>(
  items: Ref<T[]> | (() => T[]),
  options?: UseVirtualScrollItemsOptions,
): UseVirtualScrollItemsReturn<T> {
  const { threshold = 100 } = options ?? {};

  /** 规范化为 getter */
  const resolve = Array.isArray((items as any)?.value)
    ? () => (items as Ref<T[]>).value
    : (items as () => T[]);

  /** 是否启用虚拟滚动：数据量 > threshold 且 threshold > 0 */
  const enableVirtual = computed(() => threshold > 0 && resolve().length > threshold);

  /**
   * 当前应渲染的项。
   *
   * 未启用虚拟时返回全量 T[]，启用时返回占位 VisibleItem[]（实际由组件的 useVirtualList 驱动）。
   * 这里的 enableVirtual 才是关键输出，displayItems 主要为兼容简单场景保留。
   */
  const displayItems = computed((): T[] | VisibleItem<T>[] => {
    const all = resolve();
    if (!enableVirtual.value) return all as T[];
    // 当启用虚拟时，模板实际会走 YdVirtualList 分支，这里只是一个类型正确的兜底
    return all.map((data, index) => ({
      data,
      height: 0,
      index,
      key: index,
      offsetY: 0,
    })) as VisibleItem<T>[];
  });

  return {
    displayItems,
    enableVirtual,
  };
}
