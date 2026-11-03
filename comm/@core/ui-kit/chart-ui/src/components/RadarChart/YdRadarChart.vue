<script lang="ts" setup>
/**
 * YdRadarChart —— 雷达图快捷组件。
 *
 * <p>传入 `indicator`（指标定义）与 `series`（各系列取值）即可渲染；
 * 自动应用 design-token 颜色、tooltip / legend 默认配置。
 * 复杂定制场景请改用 {@link YdChart} 直接传 EChartsOption。
 *
 * @path comm\@core\ui-kit\chart-ui\src\components\RadarChart\YdRadarChart.vue
 * @author ydsz-team
 * @since 1.0.0
 */
import type { EChartsOption } from 'echarts';

import { computed } from 'vue';

import { useChartTheme, withChartTheme } from '../../composables';
import type { RadarChartProps } from '../../types';
import YdChart from '../Chart/YdChart.vue';

const props = withDefaults(defineProps<RadarChartProps>(), {
  autoresize: true,
  center: () => ['50%', '50%'],
  dark: undefined,
  emptyText: 'chart.empty',
  height: '100%',
  loading: false,
  loadingText: 'chart.loading',
  radius: '70%',
  showEmpty: true,
  transparent: true,
});

defineOptions({ name: 'YdRadarChart' });

const emit = defineEmits<{
  click: [params: unknown];
  ready: [instance: unknown];
  resize: [size: { height: number; width: number }];
}>();

const { theme } = useChartTheme({ dark: props.dark });

/**
 * 是否展示空态。
 *
 * <p>指标定义为空或系列数据为空时直接展示空态占位，不渲染空 series。
 */
const isEmpty = computed<boolean>(() => props.indicator.length === 0 || props.series.length === 0);

/**
 * 由快捷入参推导 ECharts 配置。
 */
const option = computed<EChartsOption>(() => {
  if (isEmpty.value) {
    return { series: [] };
  }

  return withChartTheme(
    {
      legend: {
        bottom: 0,
        type: 'scroll',
      },
      radar: {
        center: [...props.center],
        indicator: props.indicator.map((item) => ({
          max: item.max,
          min: item.min ?? 0,
          name: item.name,
        })),
        radius: props.radius as string | number,
      },
      series: [
        {
          data: props.series.map((item) => ({
            name: item.name,
            value: [...item.data],
          })),
          type: 'radar',
        },
      ],
      tooltip: {},
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
