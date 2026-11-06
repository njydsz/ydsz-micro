/**
 * 虚拟列表组合式函数。
 *
 * 用于大列表场景（1000+ 条数据），只渲染可视区域内的元素，
 * 大幅减少 DOM 节点数量，提升渲染性能。
 *
 * @path comm\@core\composables\src\use-virtual-list.ts
 * @author ydsz-team
 * @since 1.0.0
 *
 * @example
 * ```vue
 * <template>
 *   <div ref="containerRef" class="virtual-container">
 *     <div :style="{ height: `${totalHeight}px` }">
 *       <div v-for="item in visibleItems" :key="item.id">
 *         {{ item.name }}
 *       </div>
 *     </div>
 *   </div>
 * </template>
 *
 * <script setup>
 * import { ref } from 'vue';
 * import { useVirtualList } from '@ydsz-core/composables';
 *
 * const list = ref([...10000 条数据]);
 * const containerRef = ref<HTMLElement>();
 * const { visibleItems, totalHeight, scrollTo } = useVirtualList(list, containerRef, {
 *   itemHeight: 48,
 *   overscan: 10,
 * });
 * </script>
 * ```
 */
import { computed, ref, watch } from 'vue';

import { useElementSize, useScroll } from '@vueuse/core';

/**
 * 虚拟列表配置。
 */
export interface VirtualListOptions {
  /**
   * 每项的固定高度（px），默认 48。
   */
  itemHeight?: number;

  /**
   * 可视区域外额外渲染的项数（上下各 overscan 项），默认 10。
   * 用于减少快速滚动时的白屏闪烁。
   */
  overscan?: number;
}

/**
 * 虚拟列表组合式函数。
 *
 * @param list - 数据列表（响应式）
 * @param containerRef - 滚动容器元素引用
 * @param options - 虚拟列表配置
 * @returns visibleItems（当前可视区域的项）、totalHeight（总高度）、scrollTo（滚动到指定索引）
 */
export function useVirtualList<T>(
  list: T[] | ReturnType<typeof ref<T[]>>,
  containerRef: { value: HTMLElement | null | undefined },
  options: VirtualListOptions = {},
) {
  const { itemHeight = 48, overscan = 10 } = options;

  // 兼容 ref 与数组两种入参
  const sourceList = Array.isArray(list) ? ref(list) : list;
  const data = computed(() => sourceList.value);

  const { height: containerHeight } = useElementSize(containerRef);
  const { y: scrollTop } = useScroll(containerRef);

  const totalHeight = computed(() => data.value.length * itemHeight);

  const startIndex = computed(() => {
    const start = Math.floor(scrollTop.value / itemHeight) - overscan;
    return Math.max(0, start);
  });

  const endIndex = computed(() => {
    const visibleCount = Math.ceil((containerHeight.value || 0) / itemHeight);
    const end = startIndex.value + visibleCount + overscan * 2;
    return Math.min(data.value.length, end);
  });

  const visibleItems = computed(() => {
    return data.value.slice(startIndex.value, endIndex.value).map((item, index) => ({
      item,
      index: startIndex.value + index,
      style: {
        position: 'absolute' as const,
        top: `${(startIndex.value + index) * itemHeight}px`,
        height: `${itemHeight}px`,
        left: 0,
        right: 0,
      },
    }));
  });

  function scrollTo(index: number) {
    if (containerRef.value) {
      containerRef.value.scrollTop = index * itemHeight;
    }
  }

  return {
    visibleItems,
    totalHeight,
    scrollTo,
    startIndex,
    endIndex,
  };
}

/**
 * 监听列表变化，在数据更新时自动重置滚动位置。
 *
 * @param list - 数据列表
 * @param containerRef - 滚动容器元素引用
 */
export function useVirtualListReset<T>(
  list: T[] | ReturnType<typeof ref<T[]>>,
  containerRef: { value: HTMLElement | null | undefined },
) {
  const sourceList = Array.isArray(list) ? ref(list) : list;
  watch(
    () => sourceList.value.length,
    () => {
      if (containerRef.value) {
        containerRef.value.scrollTop = 0;
      }
    },
  );
}
