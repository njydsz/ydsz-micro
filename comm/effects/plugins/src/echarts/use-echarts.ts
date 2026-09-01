/**
 * ECharts 图表的响应式渲染与自适应组合式函数。
 *
 * 封装 echarts 实例的创建、主题切换、尺寸自适应与渲染重试逻辑，
 * 返回 renderEcharts / resize 与获取实例的方法，供模板组件调用。
 *
 * @path comm\effects\plugins\src\echarts\use-echarts.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { EChartsOption } from 'echarts';

import type { Ref } from 'vue';

import type { Nullable } from '@ydsz/types';

import type EchartsUI from './echarts-ui.vue';

import { computed, nextTick, watch } from 'vue';

import { usePreferences } from '@ydsz/preferences';

import {
  tryOnUnmounted,
  useDebounceFn,
  useResizeObserver,
  useTimeoutFn,
  useWindowSize,
} from '@vueuse/core';

import echarts from './echarts';

import { createLogger } from '@YDSZ-core/shared/utils';
const logger = createLogger('use-echarts');
type EchartsUIType = typeof EchartsUI | undefined;

type EchartsThemeType = 'dark' | 'light' | null;

/**
 * ECharts 响应式渲染组合式函数。
 *
 * @param chartRef - 指向 EchartsUI 组件实例的模板 ref
 * @returns `renderEcharts` / `resize` / `getChartInstance` 三个方法
 */
function useEcharts(chartRef: Ref<EchartsUIType>) {
  let chartInstance: echarts.ECharts | null = null;
  let cacheOptions: EChartsOption = {};
  /** 递归重试次数 */
  let renderRetryCount = 0;
  /** 最大递归重试次数 */
  const MAX_RENDER_RETRY = 10;

  const { isDark } = usePreferences();
  const { height, width } = useWindowSize();
  const resizeHandler: () => void = useDebounceFn(resize, 200);

  const getOptions = computed((): EChartsOption => {
    if (!isDark.value) {
      return {};
    }

    return {
      backgroundColor: 'transparent',
    };
  });

  /** 初始化 ECharts 实例（如果尚未创建） */
  const initCharts = (t?: EchartsThemeType) => {
    const el = chartRef?.value?.$el;
    if (!el) {
      return;
    }
    chartInstance = echarts.init(el, t || isDark.value ? 'dark' : null);

    return chartInstance;
  };

  const renderEcharts = (
    options: EChartsOption,
    clear = true,
  ): Promise<Nullable<echarts.ECharts>> => {
    cacheOptions = options;
    const currentOptions = {
      ...options,
      ...getOptions.value,
    };
    return new Promise((resolve) => {
      if (chartRef.value?.offsetHeight === 0) {
        if (renderRetryCount >= MAX_RENDER_RETRY) {
          logger.warn('[useEcharts] 图表容器高度为 0，已达到最大重试次数，终止渲染');
          resolve(null);
          return;
        }
        renderRetryCount++;
        useTimeoutFn(async () => {
          resolve(await renderEcharts(currentOptions));
        }, 30);
        return;
      }
      renderRetryCount = 0;
      nextTick(() => {
        useTimeoutFn(() => {
          if (!chartInstance) {
            const instance = initCharts();
            if (!instance) return;
          }
          if (clear) chartInstance?.clear();
          chartInstance?.setOption(currentOptions);
          resolve(chartInstance);
        }, 30);
      });
    });
  };

  /** 触发表格尺寸自适应（带动画） */
  function resize() {
    chartInstance?.resize({
      animation: {
        duration: 300,
        easing: 'quadraticIn',
      },
    });
  }

  watch([width, height], () => {
    resizeHandler?.();
  });

  useResizeObserver(chartRef as never, resizeHandler);

  watch(isDark, () => {
    if (chartInstance) {
      chartInstance.dispose();
      initCharts();
      renderEcharts(cacheOptions);
      resize();
    }
  });

  tryOnUnmounted(() => {
    // 销毁实例，释放资源
    chartInstance?.dispose();
  });
  return {
    renderEcharts,
    resize,
    getChartInstance: () => chartInstance,
  };
}

export { useEcharts };

export type { EchartsUIType };
