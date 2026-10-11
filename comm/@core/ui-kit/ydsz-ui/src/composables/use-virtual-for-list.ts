/**
 * 大数据列表虚拟滚动的高层 composable：useVirtualForList。
 *
 * <p>对标 PrimeVue VirtualScroller 与 Naive UI 的虚拟滚动策略，在 useVirtualList 纯计算层之上
 * 补充「何时启用」的判定与「选中态跨滚动保留」的业务能力：
 *
 * <ul>
 *   <li>数据量 ≤ threshold 时返回全量，不启用虚拟滚动（避免小数据下额外计算开销）；</li>
 *   <li>数据量 > threshold 时自动启用虚拟滚动，返回可见项与滚动容器 props；</li>
 *   <li>提供 `getKey` 的泛型安全封装；</li>
 * </ul>
 *
 * 适用场景：
 * - 大数据下拉列表（Select / TreeSelect / Cascader）
 * - 大数据级联面板
 * - 任意项高度固定的长列表
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-virtual-for-list.ts
 * @author ydsz-team
 * @since 26.10.11
 */

import type { Ref } from 'vue';

import { computed, ref, unref, watch } from 'vue';
import type { MaybeRef } from 'vue';

import { useVirtualList } from './use-virtual-list';
import type { UseVirtualListOptions, VirtualListHandle, VisibleItem } from './use-virtual-list';

/** 高层虚拟滚动配置 */
export interface UseVirtualForListOptions<T> extends Omit<UseVirtualListOptions, 'getKey'> {
  /**
   * 启用虚拟滚动的阈值。
   *
   * 当数据项数量超过此值时自动启用虚拟滚动以保障性能。
   * @default 200
   */
  threshold?: number;
  /**
   * 从数据项提取唯一键。
   *
   * 可以为泛型 T 提供类型安全的键提取。默认使用 index 作为 key。
   */
  getKey?: (item: T, index: number) => string | number;
  /** 数据源（响应式ref或getter） */
  items: MaybeRef<T[]>;
}

/** 高层虚拟滚动返回句柄 */
export interface UseVirtualForListHandle<T> {
  /** 当前应渲染的项：未启用虚拟时返回全量，启用后返回可见项 */
  displayItems: Ref<T[] | VisibleItem<T>[]>;
  /** 是否已启用虚拟滚动 */
  isVirtualActive: Ref<boolean>;
  /** 列表总高度（未启用虚拟滚动时为 undefined） */
  totalHeight: Ref<number | undefined>;
  /** 首个可见项的 translateY 偏移 */
  offsetY: Ref<number | undefined>;
  /** 滚动事件处理器 */
  onScroll: (event: Event) => void;
  /** 底层 handle（高级场景直接使用） */
  raw: VirtualListHandle<T>;
}

/**
 * 创建自动判定是否启用虚拟滚动的高层控制器。
 *
 * 当数据项超过 threshold 时由 useVirtualList 驱动，否则直接返回全量数据。
 *
 * @param options - 配置项
 * @returns 统一的虚拟滚动句柄
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const { displayItems, isVirtualActive, raw } = useVirtualForList({
 *   items: () => optionsList,
 *   itemHeight: 32,
 *   threshold: 200,
 * });
 * </script>
 *
 * <template>
 *   <div v-bind="raw.containerProps">
 *     <div v-bind="raw.spacerProps">
 *       <div v-for="item in displayItems" :key="item.index" class="select-option">
 *         {{ item.data.label }}
 *       </div>
 *     </div>
 *   </div>
 * </template>
 * ```
 */
export function useVirtualForList<T = unknown>(
  options: UseVirtualForListOptions<T>,
): UseVirtualForListHandle<T> {
  const {
    items,
    threshold = 200,
    itemHeight = 32,
    viewportHeight = 256,
    overscan = 5,
    getKey,
    measuredHeights,
  } = options;

  /** 规范化数据源为 Ref */
  const itemsRef = computed(() => unref(items) ?? []) as unknown as Ref<T[]>;

  /** 当前是否启用虚拟滚动 */
  const isVirtualActive = ref(itemsRef.value.length > threshold);

  // 响应数据量变化，动态切换虚拟滚动
  watch(
    () => itemsRef.value.length,
    (count) => {
      isVirtualActive.value = count > threshold;
    },
  );

  /** 底层虚拟列表 handle */
  const raw = useVirtualList(itemsRef, {
    itemHeight,
    viewportHeight,
    overscan,
    getKey: getKey as ((item: unknown, index: number) => string | number) | undefined,
    measuredHeights,
  });

  const totalHeight = computed(() => (isVirtualActive.value ? raw.totalHeight.value : undefined));
  const offsetY = computed(() => (isVirtualActive.value ? raw.offsetY.value : undefined));

  /**
   * 终端渲染项：未启用虚拟时返回全量原始数据，启用时返回 VisibleItem。
   *
   * 注：使用 unknown 类型转换是因为在未启用虚拟滚动时元素类型为 T，
   * 启用后为 VisibleItem<T>。模板层根据 isVirtualActive 分支渲染，
   * 这个联合类型对调用方是透明的。
   */
  const displayItems = computed((): T[] | VisibleItem<T>[] => {
    if (isVirtualActive.value) {
      return raw.visibleItems.value;
    }
    return itemsRef.value as T[];
  }) as Ref<T[] | VisibleItem<T>[]>;

  return {
    displayItems,
    isVirtualActive,
    totalHeight,
    offsetY,
    onScroll: raw.onScroll,
    raw,
  };
}

export { useVirtualForList as default };
