<script lang="ts" setup>
import { cn } from '@ydsz-core/shared/utils';

import { YdSkeleton } from '../skeleton';

interface Props {
  /** 自定义类名 */
  class?: any;
  /** 是否正在加载 */
  loading?: boolean;
  /** 加载数量 */
  loadingCount?: number;
  /** 列数 */
  cols?: number;
  /** 是否无更多数据 */
  finished?: boolean;
  /** 间距（px） */
  gap?: number;
}

const props = withDefaults(defineProps<Props>(), {
  cols: 3,
  finished: false,
  gap: 16,
  loading: false,
  loadingCount: 6,
});

const emit = defineEmits<{
  loadMore: [];
}>();
</script>

<template>
  <div :class="cn('space-y-4', props.class)">
    <!-- 加载态骨架屏 -->
    <div v-if="props.loading" :style="{ display: 'grid', gridTemplateColumns: `repeat(${props.cols}, minmax(0, 1fr))`, gap: `${props.gap}px` }">
      <YdSkeleton v-for="i in props.loadingCount" :key="i" class="h-48 w-full" variant="rounded" />
    </div>

    <!-- 实际内容 -->
    <div v-else :style="{ display: 'grid', gridTemplateColumns: `repeat(${props.cols}, minmax(0, 1fr))`, gap: `${props.gap}px` }">
      <slot></slot>
    </div>

    <!-- 加载更多 -->
    <div v-if="!props.loading && $slots.loader" class="flex justify-center py-4">
      <slot name="loader" :finished="props.finished"></slot>
    </div>

    <!-- 空数据 -->
    <div v-if="!props.loading && !$slots.default" class="py-12 text-center text-sm text-muted-foreground">
      <slot name="empty">暂无数据</slot>
    </div>
  </div>
</template>
