/**
 * 性能追踪器 — 类型定义
 *
 * 从 performance-tracker.ts 提取，避免单文件超过 300 行。
 *
 * @path comm/effects/monitor/src/performance-tracker-types.ts
 * @author ydsz-team
 * @since 4.0.0
 */

/** 时间线条目 */
export interface TimelineEntry {
  name: string;
  startTime: number;
  duration: number;
  category: 'load' | 'mount' | 'unmount' | 'activate' | 'deactivate' | 'preload' | 'message' | 'state' | 'route';
  appName?: string;
  timestamp: number;
}

/** 火焰图节点 */
export interface FlameNode {
  name: string;
  startTime: number;
  duration: number;
  endTime: number;
  children: FlameNode[];
  category: string;
  depth: number;
  parent?: FlameNode;
}

/** 内存采样数据 */
export interface MemorySample {
  timestamp: number;
  jsHeapUsedMB: number;
  jsHeapLimitMB: number;
  domNodes: number;
  keepAliveCount: number;
}
