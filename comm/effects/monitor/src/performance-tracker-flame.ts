/**
 * 性能追踪器 — 火焰图数据生成
 *
 * 从 performance-tracker.ts 提取，避免单文件超过 300 行。
 *
 * @path comm/effects/monitor/src/performance-tracker-flame.ts
 * @author ydsz-team
 * @since 4.0.0
 */

import type { FlameNode } from './performance-tracker-types';

/** 性能标记名称前缀 */
const MARK_PREFIX = 'YDSZ:';

/**
 * 检查追踪是否启用（内部复用，避免依赖主模块）
 */
function checkEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  if (import.meta.env.DEV) return true;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('debug_perf') === '1') return true;
  } catch {
    // 静默
  }
  try {
    if (localStorage.getItem('ydsz_perf_tracking') === 'true') return true;
  } catch {
    // 静默
  }
  return false;
}

/**
 * 获取火焰图数据（从 Performance API 中提取 YDSZ: 标记）
 */
export function getFlameData(): FlameNode[] {
  if (!checkEnabled()) return [];

  const flames: FlameNode[] = [];
  const measures = performance.getEntriesByType('measure').filter(
    (m) => m.name.startsWith(MARK_PREFIX),
  );

  // 构建树：按父子关系（名称中包含 : 的层级结构）
  const nodeMap = new Map<string, FlameNode>();

  for (const m of measures) {
    const name = m.name.slice(MARK_PREFIX.length);
    const node: FlameNode = {
      name,
      startTime: m.startTime,
      duration: m.duration,
      endTime: m.startTime + m.duration,
      children: [],
      category: name.split(':')[0] || 'unknown',
      depth: 0,
    };
    nodeMap.set(name, node);
  }

  // 构建父子关系：基于时间区间包含关系
  const allNodes = [...nodeMap.values()].sort((a, b) => a.startTime - b.startTime);

  for (let i = 0; i < allNodes.length; i++) {
    const node = allNodes[i];
    // 寻找父节点（最近一个包含当前节点的）
    for (let j = i - 1; j >= 0; j--) {
      const candidate = allNodes[j];
      if (
        candidate.startTime <= node.startTime &&
        candidate.endTime >= node.endTime &&
        candidate.name !== node.name
      ) {
        // 找到直接父节点（depth 最小的那个）
        if (!node.parent || candidate.depth > (node.parent?.depth ?? -1)) {
          node.parent = candidate;
        }
      }
    }

    if (node.parent) {
      node.parent.children.push(node);
      node.depth = node.parent.depth + 1;
    } else {
      flames.push(node);
    }
  }

  return flames;
}
