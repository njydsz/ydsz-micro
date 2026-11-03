/**
 * YdChart 组件类型。
 *
 * @path comm\@core\ui-kit\chart-ui\src\components\Chart\types.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { EChartsOption } from 'echarts';

import type { ChartBaseEmits, ChartBaseProps } from '../../types';

export type { ChartBaseEmits, ChartBaseProps };

/** YdChart 实例句柄（通过 template ref / defineExpose 暴露） */
export interface YdChartExpose {
  /** 获取底层 ECharts 实例；未初始化时返回 null */
  getInstance: () => unknown;
  /** 主动触发 resize */
  resize: () => void;
  /** 重新设置配置项 */
  setOption: (option: EChartsOption) => void;
}
