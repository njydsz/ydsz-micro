/**
 * dashboard 组合式 API 统一出口。
 *
 * @path comm\@core\ui-kit\dashboard\src\composables\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */

export { useChartCardCore, isEmptyOption } from './use-chart-card-core';

export type {
  EChartsInstanceLike,
  UseChartCardCoreOptions,
  UseChartCardCoreReturn,
} from './use-chart-card-core';

export { useDashboardState } from './use-dashboard-state';
