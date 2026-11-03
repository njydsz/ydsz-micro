/**
 * 图表通用类型契约。
 *
 * <p>所有 chart-ui 组件共享的基础 Props 与事件签名，集中在此避免每个组件各写一份。
 *
 * @path comm\@core\ui-kit\chart-ui\src\types\chart.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { EChartsOption } from 'echarts';

/**
 * 图表基础 Props。
 *
 * <p>所有图表组件（YdChart 及各类快捷图表）都继承本接口，
 * 保证 loading / 空数据 / 尺寸 / 自动 resize 等基础能力行为一致。
 */
export interface ChartBaseProps {
  /** 图表配置项；YdChart 直接透传给 ECharts，快捷图表由组件内部拼装 */
  option?: EChartsOption;
  /** 图表高度（px 或 CSS 长度）；默认撑满父容器 */
  height?: number | string;
  /** 是否显示 loading 遮罩；YdChart 初始化期间会自动进入 loading 态 */
  loading?: boolean;
  /** 是否自动跟随容器尺寸变化调用 resize；默认 true */
  autoresize?: boolean;
  /** 是否开启暗色主题适配；默认读取根节点 `.dark` class */
  dark?: boolean;
  /** 无数据时是否展示空态占位；默认 true */
  showEmpty?: boolean;
  /** 自定义空态文案 i18n key；默认 `chart.empty` */
  emptyText?: string;
  /** 自定义 loading 文案 i18n key；默认 `chart.loading` */
  loadingText?: string;
  /** 是否透明背景（不绘制 ECharts 自带底色）；默认 true */
  transparent?: boolean;
  /** 附加 CSS 类名 */
  class?: string;
  /** 附加内联样式 */
  style?: string | Record<string, string | number>;
}

/**
 * 图表基础事件。
 *
 * <p>快捷图表在用户交互（点击图元）时抛出，事件负载来自 ECharts 的 ECElementEvent。
 */
export interface ChartBaseEmits {
  /** 点击图表元素（系列数据项 / 坐标轴文本等） */
  (e: 'click', params: unknown): void;
  /** 图表容器尺寸变化后（每次 resize 完成） */
  (e: 'resize', size: { height: number; width: number }): void;
  /** 图表初始化完成（ECharts 实例就绪） */
  (e: 'ready', instance: unknown): void;
}

/**
 * 折线图 / 柱状图的系列入参。
 *
 * <p>只约束「必须有 name / data」，其余 ECharts 系列配置（smooth / areaStyle 等）
 * 通过 {@link CartesianChartProps.series} 上的可选字段透传，避免重复建模。
 */
export interface CartesianSeriesItem {
  /** 系列名称（图例与 tooltip 使用） */
  name: string;
  /** 数据序列 */
  data: ReadonlyArray<unknown>;
  /** 系列类型；折线图默认 line，柱状图默认 bar */
  type?: string;
  /** 是否平滑曲线（折线图） */
  smooth?: boolean;
  /** 是否填充面积（折线图） */
  areaStyle?: Record<string, unknown>;
  /** 柱条宽度（柱状图） */
  barWidth?: number | string;
  /** 堆叠分组名；同名的系列堆叠显示 */
  stack?: string;
  /** 额外 ECharts 系列配置，优先级高于快捷组件推导出的默认值 */
  extra?: Record<string, unknown>;
}

/**
 * 折线图 Props。
 */
export interface LineChartProps extends ChartBaseProps {
  /** X 轴类目数据 */
  categories: ReadonlyArray<string | number>;
  /** 一个或多个折线系列 */
  series: ReadonlyArray<CartesianSeriesItem>;
}

/**
 * 柱状图 Props。
 */
export interface BarChartProps extends ChartBaseProps {
  /** X 轴类目数据 */
  categories: ReadonlyArray<string | number>;
  /** 一个或多个柱状系列 */
  series: ReadonlyArray<CartesianSeriesItem>;
}

/**
 * 饼图数据项。
 */
export interface PieDataItem {
  /** 数据项名称 */
  name: string;
  /** 数据项数值 */
  value: number;
  /** 是否选中（突出显示） */
  selected?: boolean;
  /** 额外 ECharts 数据项配置 */
  extra?: Record<string, unknown>;
}

/**
 * 饼图 Props。
 */
export interface PieChartProps extends ChartBaseProps {
  /** 饼图数据 */
  data: ReadonlyArray<PieDataItem>;
  /** 饼图半径；默认 ['40%', '70%']（环形图） */
  radius?: string | number | ReadonlyArray<string | number>;
  /** 是否显示为南丁格尔玫瑰图 */
  roseType?: boolean | string;
  /** 是否显示图例；默认 true */
  showLegend?: boolean;
}

/**
 * 雷达图指标项。
 */
export interface RadarIndicatorItem {
  /** 指标名称 */
  name: string;
  /** 指标最大值 */
  max: number;
  /** 指标最小值；默认 0 */
  min?: number;
}

/**
 * 雷达图系列数据项。
 */
export interface RadarSeriesItem {
  /** 系列名称 */
  name: string;
  /** 每个指标对应的数值（顺序与 indicator 对齐） */
  data: ReadonlyArray<number>;
}

/**
 * 雷达图 Props。
 */
export interface RadarChartProps extends ChartBaseProps {
  /** 雷达指标定义 */
  indicator: ReadonlyArray<RadarIndicatorItem>;
  /** 雷达系列数据 */
  series: ReadonlyArray<RadarSeriesItem>;
  /** 雷达图半径；默认 '70%' */
  radius?: string | number;
  /** 雷达图中心位置；默认 ['50%', '50%'] */
  center?: ReadonlyArray<string | number>;
}

/**
 * 仪表盘图 Props。
 */
export interface GaugeChartProps extends ChartBaseProps {
  /** 当前值 */
  value: number;
  /** 仪表盘标题；默认不展示 */
  title?: string;
  /** 最小值；默认 0 */
  min?: number;
  /** 最大值；默认 100 */
  max?: number;
  /** 半径；默认 '75%' */
  radius?: string | number;
  /** 起始角度（度）；默认 225 */
  startAngle?: number;
  /** 结束角度（度）；默认 -45 */
  endAngle?: number;
  /** 是否显示刻度标签；默认 true */
  showAxisLabel?: boolean;
  /** 是否显示指针；默认 true */
  showPointer?: boolean;
}
