/**
 * 虚拟列表 composable —— 纯计算层，不依赖任何 UI 框架。
 *
 * <p>痛点：YdSelectSmart 下拉列表、Tree 深层目录在 1000+ 节点场景下全量渲染，
 * 导致首帧 DOM 节点过多、滚动帧率下降。
 *
 * <p>本 composable 提供：
 * <ul>
 *   <li>根据 scrollTop / viewportHeight 计算可见区间</li>
 *   <li>支持动态高度（通过 measure 回调）</li>
 *   <li>上/下 overscan 缓冲，避免快速滚动时白屏</li>
 * </ul>
 *
 * <p>典型用法：
 * ```vue
 * <script setup>
 * const { visibleItems, totalHeight, onScroll, offsetY } = useVirtualList(
 *   () => items,
 *   { itemHeight: 32, viewportHeight: 256 },
 * );
 * </script>
 * ```
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-virtual-list.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import type { MaybeRef } from 'vue';

import {
  computed,
  ref,
  unref,
  type Ref,
} from 'vue';

/** 虚拟列表配置 */
export interface UseVirtualListOptions {
  /** 每项的预估高度（像素）；动态测量场景传估算平均值 */
  itemHeight?: number;
  /** 视口高度（像素） */
  viewportHeight?: number;
  /** 上下两侧额外渲染的项数（缓冲区大小），默认 5 */
  overscan?: number;
  /** 键生成函数 —— 为返回值建立稳定的 Diff 标识 */
  getKey?: (item: unknown, index: number) => string | number;
  /** 动态高度测量映射（index -> measured height） */
  measuredHeights?: Ref<Map<number, number>>;
}

/** 单条可见项描述 */
export interface VisibleItem<T> {
  /** 原始数据项 */
  data: T;
  /** 在原始数组中的索引 */
  index: number;
  /** 该 item 相对视口顶部的偏移（含 spacer） */
  offsetY: number;
  /** 该 item 的实际渲染高度 */
  height: number;
  /** 稳定的 key 标识 */
  key: string | number;
}

/** 虚拟列表句柄 */
export interface VirtualListHandle<T> {
  /** 当前可见的项数组（含 data / index / offsetY） */
  visibleItems: Ref<VisibleItem<T>[]>;
  /** 列表总高度（撑开滚动容器） */
  totalHeight: Ref<number>;
  /** 首个可见项的 translateY 偏移（外层容器 paddingTop） */
  offsetY: Ref<number>;
  /** 滚动事件处理器（绑定到滚动容器的 @scroll） */
  onScroll: (event: Event) => void;
  /** 当前内部 scrollTop（响应式，供外部同步） */
  scrollTop: Ref<number>;
  /** 容器 props：绑定到滚动容器元素 */
  containerProps: Ref<{
    style: {
      overflowY: 'auto';
      height: string;
      position: 'relative';
    };
    onScroll: (event: Event) => void;
  }>;
  /** 包裹容器 props（撑开滚动区域，生成滚动条） */
  spacerProps: Ref<{
    style: {
      height: string;
      position: 'relative';
      width: '100%';
    };
  }>;
}

/** 默认 itemHeight 32 px（约等于 py-1.5 + text-sm 的选择项高度） */
const DEFAULT_ITEM_HEIGHT = 32;

/** 默认 overscan 5 */
const DEFAULT_OVERSCAN = 5;

/**
 * useVirtualList —— 根据 items 与滚动位置返回可见项切片。
 *
 * @param items - 原始列表（ref / reactive / getter 均可）
 * @param options - 虚拟列表配置
 * @return 虚拟列表句柄
 *
 * @example YdSelectSmart 场景：
 * ```ts
 * const {
 *   visibleItems,
 *   totalHeight,
 *   containerProps,
 *   spacerProps,
 * } = useVirtualList(
 *   computed(() => props.options),
 *   { itemHeight: 32, viewportHeight: 256, overscan: 8 },
 * );
 * ```
 *
 * @example Tree 场景（动态高度）：
 * ```ts
 * const measured = ref(new Map<number, number>());
 * const { visibleItems, totalHeight, onScroll, offsetY } = useVirtualList(
 *   () => flattenedNodes.value,
 *   {
 *     itemHeight: 28,
 *     viewportHeight: 400,
 *     measuredHeights: measured,
 *     getKey: (node) => node.id,
 *   },
 * );
 * ```
 */
export function useVirtualList<T = unknown>(
  items: MaybeRef<T[]> | (() => T[]),
  options: UseVirtualListOptions = {},
): VirtualListHandle<T> {
  const {
    itemHeight = DEFAULT_ITEM_HEIGHT,
    viewportHeight = 256,
    overscan = DEFAULT_OVERSCAN,
    getKey,
    measuredHeights,
  } = options;

  const scrollTop = ref(0);

  /** 读取 items 原始数组（支持 getter / ref / 普通数组） */
  const resolvedItems = computed<T[]>(() => {
    if (typeof items === 'function') return (items as () => T[])();
    return unref(items as MaybeRef<T[]>);
  });

  /** 计算单项实际高度 */
  const getItemHeight = (index: number): number => {
    if (measuredHeights?.value) {
      const measured = measuredHeights.value.get(index);
      if (measured !== undefined) return measured;
    }
    return itemHeight;
  };

  /** 计算 index 之前所有项的累计 offsetY */
  const getOffsetY = (index: number): number => {
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += getItemHeight(i);
    }
    return offset;
  };

  /** 总高度 */
  const totalHeight = computed(() => {
    const list = resolvedItems.value;
    if (!measuredHeights?.value) {
      return list.length * itemHeight;
    }
    let total = 0;
    for (let i = 0; i < list.length; i++) {
      total += getItemHeight(i);
    }
    return total;
  });

  /** 可见起始索引（考虑 overscan） */
  const startIndex = computed(() => {
    if (!measuredHeights?.value) {
      const raw = Math.floor(scrollTop.value / itemHeight);
      return Math.max(0, raw - overscan);
    }
    // 动态高度：累加找到首个累计 offset > scrollTop - overscanHeight 的索引
    let accumulated = 0;
    const overscanHeight = overscan * itemHeight;
    const target = Math.max(0, scrollTop.value - overscanHeight);
    for (let i = 0; i < resolvedItems.value.length; i++) {
      if (accumulated >= target) {
        return Math.max(0, i - 1);
      }
      accumulated += getItemHeight(i);
    }
    return 0;
  });

  /** 可见结束索引 */
  const endIndex = computed(() => {
    const list = resolvedItems.value;
    if (!measuredHeights?.value) {
      const visibleCount = Math.ceil(viewportHeight / itemHeight);
      return Math.min(list.length, startIndex.value + visibleCount + overscan * 2);
    }
    let accumulated = getOffsetY(startIndex.value);
    const targetEnd = scrollTop.value + viewportHeight + overscan * itemHeight;
    let i = startIndex.value;
    for (; i < list.length; i++) {
      if (accumulated >= targetEnd) break;
      accumulated += getItemHeight(i);
    }
    return Math.min(list.length, i);
  });

  /** 可见项切片 */
  const visibleItems = computed<VisibleItem<T>[]>(() => {
    const list = resolvedItems.value;
    const start = startIndex.value;
    const end = endIndex.value;
    const result: VisibleItem<T>[] = [];

    for (let i = start; i < end; i++) {
      const data = list[i];
      result.push({
        data,
        height: getItemHeight(i),
        index: i,
        key: getKey?.(data, i) ?? i,
        offsetY: getOffsetY(i),
      });
    }
    return result;
  });

  /** 偏移量（首个可见项 offsetY） */
  const offsetY = computed(() => getOffsetY(startIndex.value));

  /** 滚动事件处理 */
  function onScroll(event: Event): void {
    const target = event.target as HTMLElement | null;
    scrollTop.value = target?.scrollTop ?? 0;
  }

  /** 容器样式 props */
  const containerProps = computed(() => ({
    onScroll,
    style: {
      height: `${viewportHeight}px`,
      overflowY: 'auto' as const,
      position: 'relative' as const,
    },
  }));

  /** spacer 包裹层 props（撑开总高度，产生真实滚动条） */
  const spacerProps = computed(() => ({
    style: {
      height: `${totalHeight.value}px`,
      position: 'relative' as const,
      width: '100%' as const,
    },
  }));

  return {
    containerProps,
    offsetY,
    onScroll,
    scrollTop,
    spacerProps,
    totalHeight,
    visibleItems,
  };
}
