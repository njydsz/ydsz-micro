<script lang="ts" setup>
/**
 * YdPieChart —— 饼图快捷组件。
 *
 * <p>传入 `data`（name / value 数组）即可渲染；自动应用 design-token 颜色、
 * tooltip / legend 默认配置，支持环形图与南丁格尔玫瑰图。
 * 复杂定制场景请改用 {@link YdChart} 直接传 EChartsOption。
 *
 * @path comm\@core\ui-kit\chart-ui\src\components\PieChart\YdPieChart.vue
 * @author ydsz-team
 * @since 1.0.0
 */
import type { EChartsOption } from 'echarts';

import { computed } from 'vue';

import { useChartTheme, withChartTheme } from '../../composables';
import type { PieChartProps } from '../../types';
import YdChart from '../Chart/YdChart.vue';

const props = withDefaults(defineProps<PieChartProps>(), {
  autoresize: true,
  dark: undefined,
  emptyText: 'chart.empty',
  height: '100%',
  loading: false,
  loadingText: 'chart.loading',
  radius: () => ['40%', '70%'],
  roseType: false,
  showEmpty: true,
  showLegend: true,
  transparent: true,
});

defineOptions({ name: 'YdPieChart' });

const emit = defineEmits<{
  click: [params: unknown];
  ready: [instance: unknown];
  resize: [size: { height: number; width: number }];
}>();

const { theme } = useChartTheme({ dark: props.dark });

/**
 * 是否展示空态。
 *
 * <p>饼图数据为空时直接展示空态占位，不渲染空 series 的 ECharts 配置，
 * 避免出现「有 series 但无数据」的语义歧义。
 */
const isEmpty = computed<boolean>(() => props.data.length === 0);

/**
 * 由快捷入参推导 ECharts 配置。
 */
const option = computed<EChartsOption>(() => {
  if (isEmpty.value) {
    return { series: [] };
  }

  const legend = props.showLegend
    ? {
        bottom: 0,
        type: 'scroll',
      }
    : undefined;

  return withChartTheme(
    {
      legend,
      series: [
        {
          data: props.data.map((item) => ({
            ...(item.extra ?? {}),
            name: item.name,
            selected: item.selected,
            value: item.value,
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
            },
          },
          radius: props.radius as string | string[],
          roseType:
            typeof props.roseType === 'string'
              ? (props.roseType as 'radius' | 'area')
              : undefined,
          type: 'pie',
        },
      ],
      tooltip: {
        trigger: 'item',
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
