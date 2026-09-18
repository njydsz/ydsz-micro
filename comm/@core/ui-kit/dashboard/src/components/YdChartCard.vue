<!--
 * YdChartCard — ECharts 图表卡片。
 *
 * <p>封装 ECharts 图表的看板卡片，自动处理 resize、dark 主题、loading 态。
 *
 * @path comm\@core\ui-kit\dashboard\src\components\YdChartCard.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

import type { EChartsOption } from 'echarts';

import type { ChartCard } from '../types';

const props = defineProps<{
  card: ChartCard;
}>();

/** 图表容器引用 */
const chartContainer = ref<HTMLDivElement | null>(null);

/** ECharts 实例引用（懒加载） */
const chartInstance = ref<unknown>(null);

/** 图表是否正在初始化 */
const isInitializing = ref<boolean>(true);

/**
 * 初始化 ECharts 实例。
 */
async function initChart(): Promise<void> {
  if (!chartContainer.value) {
    return;
  }
  const echarts = await import('echarts');
  if (chartInstance.value) {
    (chartInstance.value as { dispose: () => void }).dispose();
  }
  const instance = echarts.init(chartContainer.value);
  chartInstance.value = instance;
  instance.setOption(props.option);
  isInitializing.value = false;
}

/**
 * 更新图表配置。
 */
function updateOption(): void {
  if (chartInstance.value) {
    (chartInstance.value as { setOption: (opt: EChartsOption) => void }).setOption(props.option);
  }
}

/**
 * 处理容器尺寸变化。
 */
function handleResize(): void {
  (chartInstance.value as { resize: () => void } | null)?.resize();
}

onMounted(() => {
  initChart();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  chartInstance.value?.dispose();
});

watch(() => props.option, updateOption, { deep: true });
</script>

<template>
  <div class="ds-chart-card flex h-full flex-col rounded-lg border bg-card p-4 shadow-sm">
    <!-- 标题行 -->
    <div class="mb-3 flex items-center justify-between pb-2">
      <div>
        <h4 class="text-sm font-medium text-foreground">{{ card.title }}</h4>
        <p v-if="card.subtitle" class="mt-0.5 text-xs text-muted-foreground">
          {{ card.subtitle }}
        </p>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="relative flex-1">
      <div
        v-if="isInitializing"
        class="absolute inset-0 flex items-center justify-center"
      >
        <div class="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
      <div
        ref="chartContainer"
        class="h-64 w-full"
        :class="isInitializing ? 'invisible' : ''"
      />
    </div>
  </div>
</template>
