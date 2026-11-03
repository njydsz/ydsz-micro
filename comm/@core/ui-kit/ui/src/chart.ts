/**
 * @ydsz-core/ui — chart 子路径出口。
 *
 * <p>图表组件——ECharts 标准化封装。
 *
 * <p>用法：
 * <pre>
 * import { YdChart, YdLineChart, YdBarChart, YdPieChart } from '@ydsz-core/ui/chart';
 * </pre>
 *
 * @module @ydsz-core/ui/chart
 * @author ydsz-team
 * @since 1.0.0
 */

export {
  YdChart,
  YdBarChart,
  YdGaugeChart,
  YdLineChart,
  YdPieChart,
  YdRadarChart,
} from '@ydsz-core/chart-ui';

export { useChartTheme, withChartTheme } from '@ydsz-core/chart-ui';

export type {
  BarSeries,
  ChartOption,
  GaugeSeries,
  LineSeries,
  PieDataItem,
  RadarIndicator,
  RadarSeries,
} from '@ydsz-core/chart-ui';
