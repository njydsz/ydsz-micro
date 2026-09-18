/**
 * @ydsz-core/dashboard 包出口。
 *
 * <p>BI 仪表盘组件——KPI 统计卡片、ECharts 看板、栅格布局。
 * 包含能力：
 * <ul>
 *   <li>{@link YdDashboard} — 仪表盘完整布局</li>
 *   <li>{@link YdStatCard} — KPI 数值卡片</li>
 *   <li>{@link YdChartCard} — ECharts 图表卡片</li>
 *   <li>{@link useDashboardState} — 仪表盘状态管理</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\dashboard\src\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */

// ===== 组件 =====
export {
  YdChartCard,
  YdDashboard,
  YdDashboardEditOverlay,
  YdStatCard,
} from './components';

// ===== 组合式 API =====
export { useDashboardState } from './composables';

// ===== 类型 =====
export type {
  ChartCard,
  DashboardCard,
  DashboardCardBase,
  DashboardCardType,
  DashboardConfig,
  StatCard,
  TableCard,
} from './types';

export { createDefaultConfig } from './types';
