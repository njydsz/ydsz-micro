<script lang="ts" setup>
/**
 * YdGaugeChart —— 仪表盘图快捷组件。
 *
 * <p>传入 `value`（当前值）即可渲染；自动应用 design-token 颜色、
 * tooltip / 轴向标签默认配置，支持 min / max / 半径 / 起止角度定制。
 * 复杂定制场景请改用 {@link YdChart} 直接传 EChartsOption。
 *
 * @path comm\@core\ui-kit\chart-ui\src\components\GaugeChart\YdGaugeChart.vue
 * @author ydsz-team
 * @since 1.0.0
 */
import type { EChartsOption } from 'echarts';

import { computed } from 'vue';

import { useChartTheme, withChartTheme } from '../../composables';
import type { GaugeChartProps } from '../../types';
import YdChart from '../Chart/YdChart.vue';

const props = withDefaults(defineProps<GaugeChartProps>(), {
  autoresize: true,
  dark: undefined,
  emptyText: 'chart.empty',
  endAngle: -45,
  height: '100%',
  loading: false,
  loadingText: 'chart.loading',
  max: 100,
  min: 0,
  radius: '75%',
  showAxisLabel: true,
  showEmpty: true,
  showPointer: true,
  startAngle: 225,
  transparent: true,
});

defineOptions({ name: 'YdGaugeChart' });

const emit = defineEmits<{
  click: [params: unknown];
  ready: [instance: unknown];
  resize: [size: { height: number; width: number }];
}>();

const { theme } = useChartTheme({ dark: props.dark });

/**
 * 由快捷入参推导 ECharts 配置。
 */
const option = computed<EChartsOption>(() =>
  withChartTheme(
    {
      series: [
        {
          axisLabel: {
            show: props.showAxisLabel,
          },
          axisLine: {
            lineStyle: {
              width: 20,
            },
          },
          axisTick: {
            show: false,
          },
          detail: {
            formatter: '{value}%',
            fontSize: 20,
            offsetCenter: [0, '70%'],
            valueAnimation: true,
          },
          endAngle: props.endAngle,
          max: props.max,
          min: props.min,
          pointer: {
            show: props.showPointer,
          },
          radius: props.radius as string | number,
          splitLine: {
            length: 10,
          },
          startAngle: props.startAngle,
          title: props.title
            ? {
                offsetCenter: [0, '90%'],
                show: true,
              }
            : undefined,
          type: 'gauge',
          value: props.value,
        },
      ],
      tooltip: {
        formatter: '{b} : {c}%',
      },
    },
    theme.value,
  ),
);
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
