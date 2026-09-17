<!--
 * Skeleton 骨架屏：在内容加载前占位展示。
 *
 * 支持三种基础形态（text / circular / rectangular）与自定义尺寸；
 * 开启 shimmer 动画后通过伪元素实现从左到右的反光扫过效果。
 *
 * 组件不渲染子内容，仅作占位骨架 —— 加载完成后通过条件渲染切换为真实内容。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\skeleton\YdSkeleton.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { cn } from '@ydsz-core/shared/utils';

type SkeletonVariant = 'circular' | 'rectangular' | 'rounded' | 'text';

interface Props {
  /** 自定义类名（用于覆盖尺寸） */
  class?: any;
  /** 高度覆盖（px / rem / 任意 CSS 长度） */
  height?: string;
  /** 是否开启动画 */
  shimmer?: boolean;
  /** 变体形态 */
  variant?: SkeletonVariant;
  /** 宽度覆盖 */
  width?: string;
}

const props = withDefaults(defineProps<Props>(), {
  shimmer: true,
  variant: 'text',
});

const variantClass: Record<SkeletonVariant, string> = {
  circular: 'rounded-full',
  rectangular: 'rounded-none',
  rounded: 'rounded-md',
  text: 'rounded h-4',
};
</script>

<template>
  <div
    :aria-busy="true"
    aria-label="加载中"
    role="status"
    :class="
      cn(
        'bg-skeleton-bg relative overflow-hidden',
        variantClass[props.variant],
        props.shimmer && 'after:absolute after:inset-0 after:animate-shimmer after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent',
        props.class,
      )
    "
    :style="{
      height: props.height ?? (props.variant === 'text' ? undefined : '1rem'),
      width: props.width ?? (props.variant === 'circular' ? '1rem' : '100%'),
    }"
  ></div>
</template>
