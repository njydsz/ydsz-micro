/**
 * useChartCardCore — YdChartCard 脚本核心逻辑。
 *
 * <p>从 {@link YdChartCard.vue} 提取：
 * <ul>
 *   <li>ECharts 实例懒加载（init / dispose / setOption）</li>
 *   <li>容器尺寸变化监听（window resize 绑定 / 解绑）</li>
 *   <li>option 深度合并（deep watch + setOption，notMerge 可选）</li>
 *   <li>loading / empty 态判断（isInitializing / isEmpty）</li>
 *   <li>暗色主题适配（读取 isDark 注入 echarts theme）</li>
 * </ul>
 *
 * <p>组件侧只保留：props 声明、模板渲染与 defineOptions，
 * 行为契约（props / expose）完全不变。
 *
 * @path comm\@core\ui-kit\dashboard\src\composables\use-chart-card-core.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { EChartsOption } from 'echarts';
import type { ComputedRef, Ref } from 'vue';

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { useDark } from '@vueuse/core';

/** ECharts 实例最小接口（避免引入完整类型，便于测试与懒加载） */
export interface EChartsInstanceLike {
  dispose: () => void;
  resize: () => void;
  setOption: (option: EChartsOption, notMerge?: boolean) => void;
  getOption?: () => EChartsOption;
}

/** useChartCardCore 配置 */
export interface UseChartCardCoreOptions {
  /** 图表容器 DOM 引用（由组件持有） */
  container: Ref<HTMLDivElement | null>;
  /** 当前 ECharts 配置项 */
  option: () => EChartsOption;
  /** 是否启用暗色主题注入（默认 true） */
  enableDarkTheme?: boolean;
  /** 是否在 setOption 时使用 notMerge 模式（默认 false，合并更新） */
  notMerge?: boolean;
}

/** useChartCardCore 返回句柄 */
export interface UseChartCardCoreReturn {
  /** 图表是否正在初始化（loading 态） */
  isInitializing: Readonly<Ref<boolean>>;
  /** 图表数据是否为空（option 无 series 或无数据） */
  isEmpty: ComputedRef<boolean>;
  /** 手动初始化图表（onMounted 时调用，也可外部调用） */
  initChart: () => Promise<void>;
  /** 手动更新 option（watch 自动触发，也可外部调用） */
  updateOption: () => void;
  /** 手动触发 resize */
  handleResize: () => void;
  /** 卸载清理（onBeforeUnmount 时调用） */
  disposeChart: () => void;
}

/**
 * 判断 ECharts option 是否为「空数据」。
 *
 * <p>判定规则：option 为空、无 series、或 series 为空数组时视为空。
 * 供组件展示 empty 占位。
 *
 * @param option - ECharts 配置项
 * @returns 是否为空数据
 */
export function isEmptyOption(option: EChartsOption | undefined | null): boolean {
  if (!option) return true;
  const series = (option as { series?: unknown }).series;
  if (!series) return true;
  if (Array.isArray(series)) return series.length === 0;
  // 单个 series 对象
  return false;
}

/**
 * 装配 YdChartCard 的 ECharts 核心逻辑。
 *
 * @param options - 容器引用 / option getter / 主题与合并配置
 * @returns 图表核心句柄
 */
export function useChartCardCore(options: UseChartCardCoreOptions): UseChartCardCoreReturn {
  const { container, option, enableDarkTheme = true, notMerge = false } = options;

  /** ECharts 实例引用（懒加载） */
  const chartInstance = ref<EChartsInstanceLike | null>(null);

  /** 图表是否正在初始化 */
  const isInitializing = ref<boolean>(true);

  /** 暗色模式标记 */
  const isDark = useDark();

  /**
   * 初始化 ECharts 实例。
   *
   * <p>懒加载 echarts 模块，复用已有实例时先 dispose；
   * 注入暗色主题（如启用），并设置初始 option。
   */
  async function initChart(): Promise<void> {
    if (!container.value) {
      return;
    }
    const echarts = await import('echarts');
    if (chartInstance.value) {
      chartInstance.value.dispose();
    }
    const theme = enableDarkTheme && isDark.value ? 'dark' : undefined;
    const instance = echarts.init(container.value, theme) as unknown as EChartsInstanceLike;
    chartInstance.value = instance;
    instance.setOption(option());
    isInitializing.value = false;
  }

  /**
   * 更新图表配置。
   */
  function updateOption(): void {
    if (chartInstance.value) {
      chartInstance.value.setOption(option(), notMerge);
    }
  }

  /**
   * 处理容器尺寸变化。
   */
  function handleResize(): void {
    chartInstance.value?.resize();
  }

  /**
   * 卸载清理：解绑 resize 监听并 dispose 实例。
   */
  function disposeChart(): void {
    window.removeEventListener('resize', handleResize);
    chartInstance.value?.dispose();
    chartInstance.value = null;
    isInitializing.value = true;
  }

  /** 图表数据是否为空 */
  const isEmpty = computed<boolean>(() => isEmptyOption(option()));

  onMounted(() => {
    void initChart();
    window.addEventListener('resize', handleResize);
  });

  onBeforeUnmount(() => {
    disposeChart();
  });

  watch(option, updateOption, { deep: true });

  return {
    disposeChart,
    handleResize,
    initChart,
    isEmpty,
    isInitializing,
    updateOption,
  };
}
