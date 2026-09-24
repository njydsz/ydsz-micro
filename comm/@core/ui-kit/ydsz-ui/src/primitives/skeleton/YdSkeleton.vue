<!--
 * Skeleton 骨架屏：在内容加载前占位展示。
 *
 * <p>支持的形态与组合：
 * <ul>
 *   <li><b>基础变体</b>：text / circular / rectangular / rounded —— 单一形状占位</li>
 *   <li><b>段落模式</b>：通过 <code>lines</code> 渲染多行文本骨架，末行宽度可缩减为 60%</li>
 *   <li><b>组合模式</b>：搭配 YdSkeletonGroup 可构造卡片/列表等复杂占位</li>
 * </ul>
 *
 * <p>开启 shimmer 动画后通过伪元素实现从左到右的反光扫过效果。
 *
 * <p>组件不渲染子内容，仅作占位骨架。使用 <code>aria-busy</code> 标记加载态。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\skeleton\YdSkeleton.vue
 * @author ydsz-team
 * @since 1.0.0 (26.09.17 增强段落模式与可访问性)
-->
<script lang="ts" setup>
// @ts-nocheck
import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

type SkeletonVariant = 'circular' | 'rectangular' | 'rounded' | 'text';

interface Props {
  /** 自定义类名（用于覆盖尺寸） */
  class?: any;
  /** 高度覆盖（px / rem / 任意 CSS 长度） */
  height?: string;
  /** 段落模式下的行数（基础变体下无效） */
  lines?: number;
  /** 是否开启动画 */
  shimmer?: boolean;
  /** 变体形态 */
  variant?: SkeletonVariant;
  /** 宽度覆盖 */
  width?: string;
}

const props = withDefaults(defineProps<Props>(), {
  lines: 1,
  shimmer: true,
  variant: 'text',
});

const variantClass: Record<SkeletonVariant, string> = {
  circular: 'rounded-full',
  rectangular: 'rounded-none',
  rounded: 'rounded-md',
  text: 'rounded h-4',
};

/**
 * 段落模式下每行的宽度百分比：末行缩减至 60%，其余 100%。
 */
const lineWidths = computed(() => {
  const total = props.lines;
  return Array.from({ length: total }, (_, i) =>
    i === total - 1 ? '60%' : '100%',
  );
});
</script>

<template>
  <!-- 段落模式：多行文本骨架 -->
  <div
    v-if="lines > 1"
    role="status"
    aria-busy="true"
    :aria-label="`加载中，${lines} 行`"
    class="flex w-full flex-col gap-2"
  >
    <div
      v-for="(_, idx) in lines"
      :key="idx"
      :class="
        cn(
          'relative overflow-hidden rounded bg-neutral-200 dark:bg-neutral-700',
          'h-4',
          shimmer &&
            'after:absolute after:inset-0 after:animate-shimmer after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent',
          props.class,
        )
      "
      :style="{ width: lineWidths[idx] }"
    />
  </div>

  <!-- 基础变体：单一形状 -->
  <div
    v-else
    role="status"
    aria-busy="true"
    aria-label="加载中"
    :class="
      cn(
        'relative overflow-hidden bg-neutral-200 dark:bg-neutral-700',
        variantClass[props.variant],
        props.shimmer &&
          'after:absolute after:inset-0 after:animate-shimmer after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent',
        props.class,
      )
    "
    :style="{
      height: props.height ?? (props.variant === 'text' ? undefined : '1rem'),
      width: props.width ?? (props.variant === 'circular' ? '1rem' : '100%'),
    }"
  />
</template>
