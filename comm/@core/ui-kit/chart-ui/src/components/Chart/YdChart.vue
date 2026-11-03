<script lang="ts" setup>
/**
 * YdChart —— 通用 ECharts 封装组件。
 *
 * <p>能力清单：
 * <ul>
 *   <li>懒加载 ECharts：`import('echarts')` 按需引入，避免首屏打包全量运行时；</li>
 *   <li>自动 resize：容器尺寸变化（ResizeObserver）与窗口尺寸变化（useWindowSize）双通道；</li>
 *   <li>暗色主题适配：默认读取根节点 `.dark` class，由 {@link useChartTheme} 生成主题；</li>
 *   <li>loading / 空数据态：初始化期间自动 loading，无 series 时展示空态；</li>
 *   <li>自动 dispose：组件卸载时释放 ECharts 实例；</li>
 *   <li>支持直接传入 EChartsOption。</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\chart-ui\src\components\Chart\YdChart.vue
 * @author ydsz-team
 * @since 1.0.0
 */
import type { EChartsCoreOption, EChartsType } from 'echarts';

import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';

import { useResizeObserver, useWindowSize } from '@vueuse/core';

import { useChartTheme } from '../../composables';
import type { ChartBaseProps } from '../../types';

import { useLocale } from '@ydsz-core/ydsz-ui/locale';

const props = withDefaults(defineProps<ChartBaseProps>(), {
  autoresize: true,
  dark: undefined,
  emptyText: 'chart.empty',
  height: '100%',
  loading: false,
  loadingText: 'chart.loading',
  option: undefined,
  showEmpty: true,
  transparent: true,
});

const emit = defineEmits<{
  click: [params: unknown];
  ready: [instance: unknown];
  resize: [size: { height: number; width: number }];
}>();

defineOptions({ name: 'YdChart' });

const { t } = useLocale();
const { theme, themeName, themeOption } = useChartTheme({ dark: props.dark });

/** 图表容器引用 */
const containerRef = ref<HTMLDivElement | null>(null);

/** ECharts 实例（懒加载，shallowRef 避免深层响应式代理 canvas 内部结构） */
const instanceRef = shallowRef<EChartsType | null>(null);

/** 初始化中标志：用于 loading 占位与容器隐藏 */
const initializing = ref<boolean>(true);

/** 初始化失败标志：避免渲染空态时把错误吞掉 */
const initFailed = ref<boolean>(false);

/** 容器实际尺寸（供空态与 resize 事件使用） */
const containerSize = ref<{ height: number; width: number }>({ height: 0, width: 0 });

/** 窗口尺寸：与容器尺寸共同触发 resize */
const { height: windowHeight, width: windowWidth } = useWindowSize();

/**
 * 是否展示空态。
 *
 * <p>判定顺序：初始化失败 > 显式 loading > option 为空 > series 为空。
 * 业务传入空 option 时不应显示空态（可能只是还没拿到数据），故只在
 * `option` 完全缺失或 `series` 为空数组时展示。
 */
const showEmptyState = computed<boolean>(() => {
  if (!props.showEmpty || initializing.value || props.loading) {
    return false;
  }
  const option = props.option;
  if (!option) {
    return true;
  }
  const series = option.series;
  if (Array.isArray(series)) {
    return series.length === 0;
  }
  return series === undefined;
});

/**
 * 容器样式：高度 + 附加 class / style。
 */
const containerStyle = computed<Record<string, string>>(() => {
  const height = typeof props.height === 'number' ? `${props.height}px` : props.height;
  const style: Record<string, string> = { height };
  if (typeof props.style === 'string') {
    style.cssText = props.style;
  } else if (props.style) {
    Object.assign(style, props.style);
  }
  return style;
});

/**
 * 注册 ECharts 主题（幂等）。
 *
 * <p>主题对象随暗色状态变化，注册时覆盖同名主题，避免 `registerTheme` 重复告警。
 */
async function registerTheme(echarts: {
  registerTheme: (name: string, theme: Record<string, unknown>) => void;
}): Promise<void> {
  echarts.registerTheme(themeName.value, themeOption.value);
}

/**
 * 初始化 ECharts 实例。
 */
async function initChart(): Promise<void> {
  const el = containerRef.value;
  if (!el) {
    return;
  }

  try {
    const echarts = await import('echarts');
    await registerTheme(echarts);

    // 复用已存在的实例时先释放，避免同一 DOM 上残留旧实例
    if (instanceRef.value) {
      instanceRef.value.dispose();
      instanceRef.value = null;
    }

    const instance = echarts.init(el, themeName.value);
    instanceRef.value = instance;
    initializing.value = false;

    instance.on('click', (params: unknown) => emit('click', params));

    applyOption();
    emit('ready', instance);
  } catch {
    initializing.value = false;
    initFailed.value = true;
  }
}

/**
 * 应用配置项。
 */
function applyOption(): void {
  const instance = instanceRef.value;
  if (!instance) {
    return;
  }
  const option = props.option;
  if (!option) {
    instance.clear();
    return;
  }
  instance.setOption(option, { notMerge: true });
}

/**
 * 触发 resize。
 */
function resize(): void {
  const instance = instanceRef.value;
  if (!instance) {
    return;
  }
  instance.resize();
  containerSize.value = {
    height: containerRef.value?.clientHeight ?? 0,
    width: containerRef.value?.clientWidth ?? 0,
  };
  emit('resize', containerSize.value);
}

/**
 * 更新容器尺寸（ResizeObserver 回调）。
 */
function handleContainerResize(): void {
  if (!props.autoresize) {
    return;
  }
  resize();
}

useResizeObserver(containerRef, handleContainerResize);

/**
 * 窗口尺寸变化时同步 resize。
 */
watch([windowHeight, windowWidth], () => {
  if (props.autoresize) {
    resize();
  }
});

/**
 * 配置项变化：重新应用。
 */
watch(
  () => props.option,
  () => {
    if (instanceRef.value) {
      applyOption();
    }
  },
  { deep: true },
);

/**
 * 显式 loading 切换：交给 ECharts 内置 loading 效果。
 */
watch(
  () => props.loading,
  (loading) => {
    const instance = instanceRef.value;
    if (!instance) {
      return;
    }
    if (loading) {
      instance.showLoading({ color: theme.value.palette.primary });
    } else {
      instance.hideLoading();
    }
  },
);

/**
 * 暗色状态切换：重建实例（ECharts 主题不支持热切换）。
 */
watch(themeName, () => {
  if (!instanceRef.value) {
    return;
  }
  nextTick(() => {
    void initChart();
  });
});

onMounted(() => {
  void initChart();
});

onBeforeUnmount(() => {
  instanceRef.value?.dispose();
  instanceRef.value = null;
});

defineExpose({
  getInstance: () => instanceRef.value,
  resize,
  setOption: (option: EChartsCoreOption) => {
    instanceRef.value?.setOption(option, { notMerge: true });
  },
});
</script>

<template>
  <div
    class="chart-container relative overflow-hidden"
    :class="props.class"
    :style="containerStyle"
  >
    <!-- 图表画布 -->
    <div
      ref="containerRef"
      class="chart-canvas absolute inset-0"
      :class="{ 'chart-canvas--hidden': initializing }"
      :data-initializing="initializing"
      :data-theme="themeName"
    />

    <!-- Loading 态 -->
    <div
      v-if="initializing || props.loading"
      class="chart-overlay absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground"
      data-testid="chart-loading"
    >
      <div class="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <span class="text-xs">{{ t(props.loadingText, 'chart.loading') }}</span>
    </div>

    <!-- 空数据态 -->
    <div
      v-else-if="showEmptyState"
      class="chart-overlay absolute inset-0 flex items-center justify-center text-muted-foreground"
      data-testid="chart-empty"
    >
      <span class="text-xs">{{ t(props.emptyText, 'chart.empty') }}</span>
    </div>

    <!-- 初始化失败态 -->
    <div
      v-else-if="initFailed"
      class="chart-overlay absolute inset-0 flex items-center justify-center text-muted-foreground"
      data-testid="chart-error"
    >
      <span class="text-xs">{{ t('chart.initFailed', 'chart.initFailed') }}</span>
    </div>
  </div>
</template>

<style scoped>
.chart-canvas--hidden {
  visibility: hidden;
}
</style>
