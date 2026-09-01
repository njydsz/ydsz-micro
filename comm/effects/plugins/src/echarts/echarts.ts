/**
 * ECharts 按需引入的统一入口。
 *
 * 存在的意义是**把「注册哪些组件」这件事收敛到唯一一处**：直接
 * `import * as echarts from 'echarts'` 会打进全量包（约 1MB+），而各处
 * 分散 `echarts.use()` 又会导致注册时机不确定、漏注册时图表静默不渲染。
 * 本模块在模块求值期一次性完成注册，业务侧只 `import echarts from '...'`
 * 即可，无需关心注册细节。
 *
 * 新增图表类型或组件时必须同步改两处：`echarts.use([...])` 与下方
 * `ECOption` 的联合类型，否则要么运行时不渲染，要么类型报错。
 *
 * @path comm\effects\plugins\src\echarts\echarts.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type {
  // 系列类型的定义后缀都为 SeriesOption
  BarSeriesOption,
  LineSeriesOption,
  PieSeriesOption,
} from 'echarts/charts';
import type {
  DatasetComponentOption,
  GridComponentOption,
  LegendComponentOption,
  // 组件类型的定义后缀都为 ComponentOption
  TitleComponentOption,
  ToolboxComponentOption,
  TooltipComponentOption,
} from 'echarts/components';
import type { ComposeOption } from 'echarts/core';

import { BarChart, LineChart, PieChart, RadarChart } from 'echarts/charts';
import {
  // 数据集组件
  DatasetComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  // 内置数据转换器组件 (filter, sort)
  TransformComponent,
} from 'echarts/components';
import * as echarts from 'echarts/core';
import { LabelLayout, UniversalTransition } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';

/**
 * 项目内 ECharts 图表配置项的收窄类型。
 *
 * @remarks
 * 为了配合按需引入减小打包体积，这里用 `ComposeOption` 只组合出**当前已注册**的
 * 系列与组件对应的配置类型，而非 echarts 完整的 `EChartsOption`。
 *
 * 因此存在两个使用约束：
 * - 使用未在此列出的配置（如 `legend`、`toolbox`）时 TS 会报错，但运行时是可用的，
 *   因为对应组件已在下方 `echarts.use` 中注册——需要类型支持时请把对应 Option 补进本联合类型；
 * - 使用**未注册**的图表类型（如 `map`、`gauge`）会在运行时静默不渲染，务必先 `use` 再使用。
 *
 * 通过 `ComposeOption` 组合出只包含已注册组件与图表的 Option 类型。
 */
export type ECOption = ComposeOption<
  | BarSeriesOption
  | DatasetComponentOption
  | GridComponentOption
  | LegendComponentOption
  | LineSeriesOption
  | PieSeriesOption
  | TitleComponentOption
  | ToolboxComponentOption
  | TooltipComponentOption
>;

// 注册必须的组件
echarts.use([
  TitleComponent,
  PieChart,
  RadarChart,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  BarChart,
  LineChart,
  LabelLayout,
  UniversalTransition,
  CanvasRenderer,
  LegendComponent,
  ToolboxComponent,
]);

/**
 * 已完成组件注册（bar / line / pie / radar + 常用组件 + CanvasRenderer）的
 * echarts 命名空间。
 *
 * 与 `echarts/core` 的区别：本导出可直接调用 `echarts.init()`，无需再
 * `use()`；未注册的图表类型（如 `map`、`gauge`）仍会静默不渲染。
 *
 * @example
 * ```ts
 * import echarts from '@YDSZ-effects/plugins/echarts';
 * const chart = echarts.init(el);
 * chart.setOption(option as ECOption);
 * ```
 */
export default echarts;
