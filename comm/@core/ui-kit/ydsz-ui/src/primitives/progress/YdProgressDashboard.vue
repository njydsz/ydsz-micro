<script lang="ts" setup>
/**
* Progress Dashboard —— 仪表盘进度（半圆）。
* 
 * 用 SVG <path> 绘制一段 180° 圆弧作为轨道，
 * 再叠一层同路径的指示器 path，通过 stroke-dasharray / stroke-dashoffset
 * 驱动「填充长度」动画。
* 
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\progress\YdProgressDashboard.vue
 * @author ydsz-team
 * @since 1.0.0
 */
// @ts-nocheck
import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

interface Props {
  /** 当前进度值（0-100） */
  value: number;
  /** SVG 画布宽度（px），高度取 size/2 */
  size?: number;
  /** 线条宽度（px） */
  strokeWidth?: number;
  /** 指示器颜色 */
  color?: string;
  /** 轨道颜色 */
  trackColor?: string;
  /** 是否在弧心下方显示百分比文本 */
  showInfo?: boolean;
  /** 自定义类名 */
  class?: any;
}

const props = withDefaults(defineProps<Props>(), {
  value: 0,
  size: 120,
  strokeWidth: 8,
  trackColor: 'rgba(var(--primary), 0.15)',
  color: 'rgb(var(--primary))',
  showInfo: true,
});

/** 安全取值，钳制到 0-100 */
const safeValue = computed(() => Math.min(100, Math.max(0, props.value)));

/** 半圆路径参数 */
const radius = computed(() => (props.size - props.strokeWidth) / 2);
const halfArcLength = computed(() => Math.PI * radius.value);

/**
 * 生成 180° 半圆弧路径：从左下到右下，圆心向下偏移形成底部弧线。
 * M startX cy A r r 0 0 1 endX cy — sweep=1 顺时针，得到下凸弧。
 */
const arcPath = computed(() => {
  const r = radius.value;
  const startX = props.strokeWidth / 2;
  const endX = props.size - props.strokeWidth / 2;
  const cy = props.size / 2;

  return `M ${startX} ${cy} A ${r} ${r} 0 0 1 ${endX} ${cy}`;
});

/** dashoffset 动画偏移 */
const dashOffset = computed(() => halfArcLength.value * (1 - safeValue.value / 100));
</script>

<template>
  <div
    :class="cn('relative inline-flex items-end justify-center', props.class)"
    :style="{ width: `${size}px`, height: `${size / 2 + (showInfo ? 20 : 0)}px` }"
    role="progressbar"
    :aria-valuenow="safeValue"
    aria-valuemin="0"
    aria-valuemax="100"
  >
    <svg
      :width="size"
      :height="size / 2"
      :viewBox="`0 0 ${size} ${size / 2}`"
      class="block"
    >
      <!-- 轨道 -->
      <path
        :d="arcPath"
        fill="none"
        :stroke="trackColor"
        :stroke-width="strokeWidth"
        stroke-linecap="round"
      />
      <!-- 指示器 -->
      <path
        :d="arcPath"
        fill="none"
        :stroke="color"
        :stroke-width="strokeWidth"
        stroke-linecap="round"
        :stroke-dasharray="halfArcLength"
        :stroke-dashoffset="dashOffset"
        style="transition: stroke-dashoffset 300ms ease-out"
      />
    </svg>

    <!-- 百分比文本，位于弧心下方 -->
    <span
      v-if="showInfo"
      class="absolute bottom-0 text-sm font-medium text-foreground tabular-nums"
      :style="{ transform: 'translateY(2px)' }"
    >
      {{ safeValue }}%
    </span>
  </div>
</template>
