/**
 * dashboard API 接口定义 — 概览统计 / 工作台数据
 *
 * @path main\src\api\core\dashboard.ts
 * @author ydsz-team
 * @since 4.1.0
 */
import { requestClient } from '#/api/request';

/** 概览统计项（analytics 页顶部卡片）。 */
export interface OverviewItem {
  /** 统计项标题（如 用户量） */
  title: string;
  /** 累计总值标题（如 总用户量） */
  totalTitle: string;
  /** 累计总值 */
  totalValue: number;
  /** 今日/增量值 */
  value: number;
}

/** 工作台-项目列表项。 */
export interface ProjectItem {
  color?: string;
  content: string;
  date: string;
  group: string;
  icon: string;
  title: string;
  url: string;
}

/** 工作台-快捷导航项。 */
export interface QuickNavItem {
  color: string;
  icon: string;
  title: string;
  url: string;
}

/** 工作台-待办事项项。 */
export interface TodoItem {
  completed: boolean;
  content: string;
  date: string;
  title: string;
}

/** 工作台-最新动态项。 */
export interface TrendItem {
  avatar: string;
  content: string;
  date: string;
  title: string;
}

/** 工作台数据聚合响应。 */
export interface WorkspaceData {
  projects: ProjectItem[];
  quickNavs: QuickNavItem[];
  todos: TodoItem[];
  trends: TrendItem[];
  /** 问候文案（可选，后端可返回时段化问候语） */
  greeting?: string;
}

/**
 * 获取数据分析概览统计项（用户量/访问量/下载量/使用量）。
 * 后端未就绪时返回空数组，由调用方回退到本地默认值。
 */
export function getOverviewStatsApi() {
  return requestClient.get<OverviewItem[]>('/api/v1/dashboard/overview');
}

/**
 * 获取工作台聚合数据（项目/快捷导航/待办/动态）。
 * 后端未就绪时返回空对象，由调用方回退到本地默认值。
 */
export function getWorkspaceDataApi() {
  return requestClient.get<WorkspaceData>('/api/v1/dashboard/workspace');
}
