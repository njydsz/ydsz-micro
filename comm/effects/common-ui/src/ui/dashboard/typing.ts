/**
 * 看板（dashboard）区域的数据契约：分析概览页与工作台页各区块的条目类型。
 *
 * 全部是纯展示模型（不含行为），因此各应用可以直接按这些类型从接口取数后
 * 传入组件，无需适配层。字段刻意保持扁平，便于后端用简单查询拼装。
 *
 * @path comm\effects\common-ui\src\ui\dashboard\typing.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { Component } from 'vue';

interface AnalysisOverviewItem {
  icon: Component | string;
  title: string;
  totalTitle: string;
  totalValue: number;
  value: number;
}

interface WorkbenchProjectItem {
  color?: string;
  content: string;
  date: string;
  group: string;
  icon: Component | string;
  title: string;
  url?: string;
}

interface WorkbenchTrendItem {
  avatar: string;
  content: string;
  date: string;
  title: string;
}

interface WorkbenchTodoItem {
  completed: boolean;
  content: string;
  date: string;
  title: string;
}

interface WorkbenchQuickNavItem {
  color?: string;
  icon: Component | string;
  title: string;
  url?: string;
}

export type {
  AnalysisOverviewItem,
  WorkbenchProjectItem,
  WorkbenchQuickNavItem,
  WorkbenchTodoItem,
  WorkbenchTrendItem,
};
