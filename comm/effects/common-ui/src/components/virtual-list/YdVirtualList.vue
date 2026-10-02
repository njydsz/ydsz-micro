<!--
 * 虚拟滚动列表组件 — 高性能大数据列表渲染
 *
 * <p>通过仅渲染可视区域内的元素（视口渲染 / windowing），将数千行数据
 * 的渲染 DOM 节点控制在固定数量（通常 20-50 个），实现 O(1) 级别渲染性能。
 *
 * <p>适用场景：用户列表（1000+ 行）、任务看板、消息记录、日志流等大数据列表。
 *
 * <p>使用示例（配合任意列表项组件）：
 * ```vue
 * <YdVirtualList
 *   :items="userList"
 * :item-height="56"
 * :buffer-size="5"
 *   class="h-[600px]"
 * >
 *   <template #default="{ item, index }">
 *     <UserListItem :user="item" :index="index" />
 *   </template>
 * </YdVirtualList>
 * ```
 *
 * @author ydsz-team
 * @since 26.10.02
-->
<script setup lang="ts" generic="T">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  useTemplateRef,
} from 'vue';

import { cn } from '@ydsz-core/shared/utils';

// === Props ===

const props = withDefaults(
  defineProps<{
    /** 完整数据源 */
    items: T[];
    /** 单行高度（px，固定高度模式使用） */
    itemHeight?: number;
    /** 上下缓冲区行数（额外渲染的不可见行数，减少滚动白屏） */
    bufferSize?: number;
    /** 滚动容器 CSS 类名 */
    containerClass?: string;
    /** 无数据时展示的空态文本 */
    emptyText?: string;
  }>(),
  {
    itemHeight: 56,
    bufferSize: 5,
    containerClass: '',
    emptyText: '暂无数据',
  },
);

// === Refs ===

/** 滚动容器引用 */
const containerRef = useTemplateRef<HTMLDivElement>('container');
/** 滚动偏移量（px） */
const scrollTop = ref(0);
/** 视口可见高度（px） */
const viewportHeight = ref(0);

// === Computed ===

/** 总滚动高度（撑起滚动条） */
const totalHeight = computed<number>(() => {
  const items = props.items;
  if (items.length === 0) {
    return 0;
  }
  return items.length * props.itemHeight;
});

/** 可视索引范围（含缓冲区） */
const visibleRange = computed<{ start: number; end: number }>(() => {
  const { itemHeight, bufferSize } = props;
  if (viewportHeight.value === 0) {
    return { start: 0, end: 0 };
  }
  const visibleCount = Math.ceil(viewportHeight.value / itemHeight);
  const rawStart = Math.floor(scrollTop.value / itemHeight);

  // 缓冲区起算（不低于 0）
  const startIndex = Math.max(0, rawStart - bufferSize);
  // 缓冲区终止（不超过总数）
  const endIndex = Math.min(props.items.length, rawStart + visibleCount + bufferSize);

  return { start: startIndex, end: endIndex };
});

/** 当前应渲染的子集数据 */
const visibleItems = computed<T[]>(() => {
  const { start, end } = visibleRange.value;
  return props.items.slice(start, end);
});

/** translateY 偏移量（将可视元素定位到滚动位置） */
const translateY = computed<number>(() => {
  return visibleRange.value.start * props.itemHeight;
});

// === Methods ===

/**
 * 处理滚动事件 — 使用 passive 提升性能
 */
function handleScroll(event: Event): void {
  const target = event.target as HTMLDivElement;
  scrollTop.value = target.scrollTop;
}

/**
 * 更新视口高度
 */
function updateViewportHeight(): void {
  if (containerRef.value) {
    viewportHeight.value = containerRef.value.clientHeight;
  }
}

// === Lifecycle ===

/** ResizeObserver 监听容器尺寸变化 */
let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  updateViewportHeight();
  if (containerRef.value) {
    resizeObserver = new ResizeObserver(updateViewportHeight);
    resizeObserver.observe(containerRef.value);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
});
</script>

<template>
  <!-- 空的兜底态 -->
  <div
    v-if="items.length === 0"
    :class="cn('flex size-full items-center justify-center text-sm text-text-secondary', containerClass)"
  >
    {{ emptyText }}
  </div>

  <!-- 滚动容器 -->
  <div
    v-else
    ref="container"
    :class="cn('relative overflow-auto', containerClass)"
    @scroll.passive="handleScroll"
  >
    <!-- 总高度占位（撑起滚动条） -->
    <div class="relative w-full" :style="{ height: `${totalHeight}px` }">
      <!-- 可视区域 — translateY 定位到正确的位置 -->
      <div
        class="absolute inset-x-0 top-0"
        :style="{ transform: `translateY(${translateY}px)` }"
      >
        <!-- 渲染可见行 -->
        <div
          v-for="(item, index) in visibleItems"
          :key="visibleRange.start + index"
          :style="{ height: `${itemHeight}px` }"
          class="w-full"
        >
          <!-- 默认插槽 — 透传数据项与全局索引 -->
          <slot :item="item" :index="visibleRange.start + index" />
        </div>
      </div>
    </div>
  </div>
</template>
