<!--
 * 迷你趋势图（纯 SVG Sparkline，零依赖）。
 *
 * 设计目标：
 *  - 替代重量级 ECharts 渲染小型趋势线（指标卡底部、列表统计列等）；
 *  - 平滑曲线 + 渐变填充 + 最小/最大点高亮；
 *  - 纯 SVG 方案，无外部依赖，暗色模式自动适配。
 *
 * 设计取舍：不做 YdTooltipRoot、不做坐标轴——仅当「一眼扫趋势」的信息密度足够。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\components\dashboard\YdMiniChart.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

defineOptions({
  name: 'YdMiniChart',
});

interface Props {
  /** 数据点数组（数值序列） */
  data: number[];
  /** 曲线颜色（CSS 颜色值或设计 Token） */
  color?: string;
  /** 是否显示渐变填充 */
  filled?: boolean;
  /** 曲线宽度（px） */
  strokeWidth?: number;
  /** 自定义类名 */
  className?: string;
  /** 图表高度（px） */
  height?: number;
  /** 图表宽度（px，自适应父容器） */
  width?: number | string;
}

const props = withDefaults(defineProps<Props>(), {
  className: '',
  color: 'hsl(var(--primary))',
  data: () => [],
  filled: true,
  height: 40,
  strokeWidth: 2,
  width: '100%',
});

/** 内部尺寸 */
const viewBoxWidth = 200;
const viewBoxHeight = 40;
const padding = 4;

/** 计算 SVG 路径 */
const pathData = computed<{ areaPath: string; linePath: string }>(() => {
  const values = props.data;
  if (values.length === 0) return { areaPath: '', linePath: '' };

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1; // 防止除以 0

  const stepX = (viewBoxWidth - padding * 2) / Math.max(values.length - 1, 1);

  /** 将数据点映射到 SVG 坐标 */
  const points: Array<{ x: number; y: number }> = values.map((value, index) => ({
    x: padding + index * stepX,
    y: viewBoxHeight - padding - ((value - min) / range) * (viewBoxHeight - padding * 2),
  }));

  // 折线路径
  const linePath = points
    .map((p, index) => `${index === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ' );

  // 填充路径（延伸到基线）
  const areaPath = `${linePath} L ${points[points.length - 1]?.x.toFixed(2) ?? 0} ${viewBoxHeight - padding} L ${padding} ${viewBoxHeight - padding} Z`;

  return { areaPath, linePath };
});

/** 渐变 id（防止多实例冲突） */
const gradientId = `mini-chart-grad-${Math.random().toString(36).slice(2, 8)}`;
</script>

<template>
  <svg
    :class="cn('overflow-visible', className)"
    :viewBox="`0 0 ${viewBoxWidth} ${viewBoxHeight}`"
    :style="{ height: `${height}px`, width: typeof width === 'number' ? `${width}px` : width }"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <!-- 渐变填充定义 -->
    <defs>
      <linearGradient
        :id="gradientId"
        x1="0"
        x2="0"
        y1="0"
        y2="1"
      >
        <stop
          offset="0%"
          :stop-color="color"
          stop-opacity="0.3"
        />
        <stop
          offset="100%"
          :stop-color="color"
          stop-opacity="0"
        />
      </linearGradient>
    </defs>

    <!-- 填充区域 -->
    <path
      v-if="filled && pathData.areaPath"
      :d="pathData.areaPath"
      :fill="`url(#${gradientId})`"
    />

    <!-- 趋势线 -->
    <path
      v-if="pathData.linePath"
      :d="pathData.linePath"
      :stroke="color"
      :stroke-width="strokeWidth"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>
