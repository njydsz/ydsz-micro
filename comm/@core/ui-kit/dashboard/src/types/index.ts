/**
 * 仪表盘 BI 看板类型定义。
 *
 * @path comm\@core\ui-kit\dashboard\src\types\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { EChartsOption } from 'echarts';

/** 看板卡片类型 */
export type DashboardCardType = 'chart-stat' | 'chart-line' | 'chart-bar' | 'chart-pie' | 'chart-area' | 'simple-stat' | 'table-card';

/** 卡片基础信息 */
export interface DashboardCardBase {
  /** 唯一 ID */
  id: string;
  /** 卡片类型 */
  type: DashboardCardType;
  /** 标题 */
  title: string;
  /** 副标题/说明 */
  subtitle?: string;
  /** 列跨度（1-12） */
  span: number;
  /** 排序序号 */
  sort: number;
}

/** KPI 单值卡片 */
export interface StatCard extends DashboardCardBase {
  type: 'chart-stat' | 'simple-stat';
  /** 当前值 */
  value: string | number;
  /** 对比前值（用于计算趋势） */
  compareValue?: number;
  /** 单位 */
  unit?: string;
  /** 格式化精度 */
  precision?: number;
  /** 前缀（如 ¥ / $） */
  prefix?: string;
  /** 后缀（如 % / 人） */
  suffix?: string;
  /** 图标名称 */
  icon?: string;
  /** 色系 */
  color?: 'primary' | 'success' | 'warning' | 'destructive' | 'muted';
}

/** ECharts 图表卡片 */
export interface ChartCard extends DashboardCardBase {
  type: 'chart-line' | 'chart-bar' | 'chart-pie' | 'chart-area';
  /** ECharts 配置项（计算属性或 JSON） */
  option: EChartsOption;
  /** 是否自动刷新 */
  isAutoRefresh?: boolean;
  /** 刷新间隔（秒） */
  refreshInterval?: number;
}

/** 数据表格卡片 */
export interface TableCard extends DashboardCardBase {
  type: 'table-card';
  /** 列定义 */
  columns: Array<{ key: string; title: string; width?: number }>;
  /** 行数据 */
  data: Array<Record<string, unknown>>;
}

/** 卡片联合类型 */
export type DashboardCard = StatCard | ChartCard | TableCard;

/** 仪表盘配置 */
export interface DashboardConfig {
  /** 仪表盘 ID */
  id: string;
  /** 仪表盘标题 */
  title: string;
  /** 卡片列表 */
  cards: DashboardCard[];
  /** 列数 */
  columns: number;
  /** 是否进入编辑模式 */
  isEditable: boolean;
}

/** 默认配置 */
export function createDefaultConfig(title: string): DashboardConfig {
  return {
    id: `dash_${Date.now()}`,
    title,
    cards: [],
    columns: 12,
    isEditable: false,
  };
}
