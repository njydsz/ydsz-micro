<script lang="ts" setup>
/**
* Progress Circle —— 圆形进度环。
* 
 * 使用 SVG 双 circle 实现：track 轨道 + indicator 指示器，
 * 通过 stroke-dasharray / stroke-dashoffset 完成「填充长度」的可动画控制。
* 
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\progress\YdProgressCircle.vue
 * @author ydsz-team
 * @since 1.0.0
 */
// @ts-nocheck
import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

interface Props {
  /** 当前进度值（0-100） */
  value: number;
  /** SVG 画布尺寸（px） */
  size?: number;
  /** 线条宽度（px） */
  strokeWidth?: number;
  /** 指示器颜色（CSS 颜色值或 CSS 变量表达式，如 `rgb(var(--primary))`） */
  color?: string;
  /** 轨道颜色 */
  trackColor?: string;
  /** 是否在中心显示百分比文本 */
  showInfo?: boolean;
  /** 自定义类名 */
  class?: any;
}

const props = withDefaults(defineProps<Props>(), {
  value: 0,
  size: 80,
  strokeWidth: 6,
  trackColor: 'rgba(var(--primary), 0.15)',
  color: 'rgb(var(--primary))',
  showInfo: true,
});

/** 安全取值，钳制到 0-100 */
const safeValue = computed(() => Math.min(100, Math.max(0, props.value)));

/** 半径 + 周长 + 偏移量 */
const radius = computed(() => (props.size - props.strokeWidth) / 2);
const circumference = computed(() => 2 * Math.PI * radius.value);
const dashOffset = computed(() => circumference.value * (1 - safeValue.value / 100));

const cx = computed(() => props.size / 2);
const cy = computed(() => props.size / 2);
</script>

<template>
  <div
    :class="cn('relative inline-flex items-center justify-center', props.class)"
    :style="{ width: `${size}px`, height: `${size}px` }"
    role="progressbar"
    :aria-valuenow="safeValue"
    aria-valuemin="0"
    aria-valuemax="100"
  >
    <svg
      :width="size"
      :height="size"
      :viewBox="`0 0 ${size} ${size}`"
      class="block"
      style="transform: rotate(-90deg)"
    >
      <!-- 轨道 -->
      <circle
        :cx="cx"
        :cy="cy"
        :r="radius"
        fill="none"
        :stroke="trackColor"
        :stroke-width="strokeWidth"
      />
      <!-- 指示器 -->
      <circle
        :cx="cx"
        :cy="cy"
        :r="radius"
        fill="none"
        :stroke="color"
        :stroke-width="strokeWidth"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        style="transition: stroke-dashoffset 300ms ease-out"
      />
    </svg>

    <!-- 中心百分比文本 -->
    <span
      v-if="showInfo"
      class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-sm font-medium text-foreground tabular-nums"
    >
      {{ safeValue }}%
    </span>
  </div>
</template>
