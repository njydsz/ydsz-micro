<script lang="ts" setup>
/**
 * YdLineChart —— 折线图快捷组件。
 *
 * <p>传入 `categories`（X 轴类目）与 `series`（折线序列）即可渲染；
 * 自动应用 design-token 颜色、tooltip / legend / grid 默认配置。
 * 复杂定制场景请改用 {@link YdChart} 直接传 EChartsOption。
 *
 * @path comm\@core\ui-kit\chart-ui\src\components\LineChart\YdLineChart.vue
 * @author ydsz-team
 * @since 1.0.0
 */
import type { EChartsOption } from 'echarts';

import { computed } from 'vue';

import { useChartTheme, withChartTheme } from '../../composables';
import type { LineChartProps } from '../../types';
import YdChart from '../Chart/YdChart.vue';

const props = withDefaults(defineProps<LineChartProps>(), {
  autoresize: true,
  dark: undefined,
  emptyText: 'chart.empty',
  height: '100%',
  loading: false,
  loadingText: 'chart.loading',
  showEmpty: true,
  transparent: true,
});

defineOptions({ name: 'YdLineChart' });

const emit = defineEmits<{
  click: [params: unknown];
  ready: [instance: unknown];
  resize: [size: { height: number; width: number }];
}>();

const { theme } = useChartTheme({ dark: props.dark });

/**
 * 由快捷入参推导 ECharts 配置。
 *
 * <p>颜色、文本、边框等主题相关字段由 `withChartTheme` 统一注入；
 * 系列配置只在调用方未显式指定时补默认（smooth 折线、stack 透传等）。
 */
const option = computed<EChartsOption>(() => {
  const series = props.series.map((item) => ({
    ...(item.extra ?? {}),
    data: [...item.data] as Array<number | string | null | undefined>,
    name: item.name,
    smooth: item.smooth ?? true,
    type: (item.type ?? 'line') as 'line',
  }));

  return withChartTheme(
    {
      grid: {
        bottom: 8,
        containLabel: true,
        left: 8,
        right: 16,
        top: 24,
      },
      legend: {
        bottom: 0,
        type: 'scroll',
      },
      series,
      tooltip: {
        axisPointer: { type: 'line' },
        trigger: 'axis',
      },
      xAxis: {
        boundaryGap: false,
        data: [...props.categories],
        type: 'category',
      },
      yAxis: {
        type: 'value',
      },
    },
    theme.value,
  );
});
</script>

<template>
  <YdChart
    :autoresize="props.autoresize"
    :class="props.class"
    :dark="props.dark"
    :empty-text="props.emptyText"
    :height="props.height"
    :loading="props.loading"
    :loading-text="props.loadingText"
    :option="option"
    :show-empty="props.showEmpty"
    :style="props.style"
    :transparent="props.transparent"
    @click="emit('click', $event)"
    @ready="emit('ready', $event)"
    @resize="emit('resize', $event)"
  />
</template>
