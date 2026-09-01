/**
 * 画布对齐操作 composable —— 提供节点对齐与分布功能（v4.4.1）。
 *
 * <p>从 DesignerCanvas.vue 提取对齐/分布逻辑，
 * 降低主文件行数，同时使对齐能力可在其他画布组件中复用。
 *
 * <p>支持 8 种对齐操作：
 * - 水平：左对齐 / 水平居中 / 右对齐
 * - 垂直：上对齐 / 垂直居中 / 下对齐
 * - 分布：水平分布 / 垂直分布
 *
 * @path apps/workflow-web/src/views/designer/use-canvas-alignment.ts
 * @author ydsz-team
 * @since 4.4.1
 */

import type { LogicFlow } from '@logicflow/core';

import type { LfGraphNode } from './types';

/** 选中的节点信息（裁剪业务所需的最小字段集） */
interface SelectedNodeInfo {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 画布对齐能力组合式函数。
 *
 * @param lfGetter - 返回 LogicFlow 实例的函数（延迟访问，避免循环依赖）
 * @returns 对齐与分布操作方法集合
 *
 * @example
 * ```ts
 * // 在 setup 中
 * const alignment = useCanvasAlignment(() => lfRef.value);
 * // 调用
 * alignment.alignLeft();
 * alignment.distributeHorizontal();
 * ```
 */
export function useCanvasAlignment(lfGetter: () => LogicFlow | null) {
  /**
   * 获取当前选中的节点列表（含坐标和尺寸）。
   *
   * @returns 选中节点信息数组，选中不足 2 个时返回空数组
   */
  function getSelectedNodes(): SelectedNodeInfo[] {
    const lf = lfGetter();
    if (!lf) return [];

    const nodes = lf.graphModel.nodes as unknown as LfGraphNode[];
    const selectedIds = nodes.filter((n) => n.isSelected).map((n) => n.id);
    if (selectedIds.length < 2) return [];

    return selectedIds.map((id) => {
      const node = (lf!.graphModel.nodes as unknown as LfGraphNode[]).find((n) => n.id === id);
      const { x, y, width, height } = node ?? {};
      return { id, x: x ?? 0, y: y ?? 0, width: width ?? 100, height: height ?? 50 };
    });
  }

  /**
   * 左对齐 —— 将所有选中节点对齐到最左侧。
   *
   * 取选中节点中的最小 x 值，将所有节点 x 坐标设为该值。
   */
  function alignLeft(): void {
    const nodes = getSelectedNodes();
    if (nodes.length < 2) return;
    const minX = Math.min(...nodes.map((n) => n.x));
    nodes.forEach((n) => {
      lfGetter()?.updateNode(n.id, { x: minX });
    });
  }

  /**
   * 水平居中对齐 —— 将所有选中节点对齐到垂直中线。
   *
   * 取选中节点水平中心点的平均值，将所有节点中心对齐到该位置。
   */
  function alignCenter(): void {
    const nodes = getSelectedNodes();
    if (nodes.length < 2) return;
    const avgX = nodes.reduce((sum, n) => sum + n.x + n.width / 2, 0) / nodes.length;
    nodes.forEach((n) => {
      lfGetter()?.updateNode(n.id, { x: avgX - n.width / 2 });
    });
  }

  /**
   * 右对齐 —— 将所有选中节点对齐到最右侧。
   *
   * 取选中节点中的最大右边界值，将所有节点右边缘对齐到该位置。
   */
  function alignRight(): void {
    const nodes = getSelectedNodes();
    if (nodes.length < 2) return;
    const maxRight = Math.max(...nodes.map((n) => n.x + n.width));
    nodes.forEach((n) => {
      lfGetter()?.updateNode(n.id, { x: maxRight - n.width });
    });
  }

  /**
   * 上对齐 —— 将所有选中节点对齐到最上方。
   *
   * 取选中节点中的最小 y 值，将所有节点 y 坐标设为该值。
   */
  function alignTop(): void {
    const nodes = getSelectedNodes();
    if (nodes.length < 2) return;
    const minY = Math.min(...nodes.map((n) => n.y));
    nodes.forEach((n) => {
      lfGetter()?.updateNode(n.id, { y: minY });
    });
  }

  /**
   * 垂直居中对齐 —— 将所有选中节点对齐到水平中线。
   *
   * 取选中节点垂直中心点的平均值，将所有节点中心对齐到该位置。
   */
  function alignMiddle(): void {
    const nodes = getSelectedNodes();
    if (nodes.length < 2) return;
    const avgY = nodes.reduce((sum, n) => sum + n.y + n.height / 2, 0) / nodes.length;
    nodes.forEach((n) => {
      lfGetter()?.updateNode(n.id, { y: avgY - n.height / 2 });
    });
  }

  /**
   * 下对齐 —— 将所有选中节点对齐到最下方。
   *
   * 取选中节点中的最大下边界值，将所有节点下边缘对齐到该位置。
   */
  function alignBottom(): void {
    const nodes = getSelectedNodes();
    if (nodes.length < 2) return;
    const maxBottom = Math.max(...nodes.map((n) => n.y + n.height));
    nodes.forEach((n) => {
      lfGetter()?.updateNode(n.id, { y: maxBottom - n.height });
    });
  }

  /**
   * 水平分布 —— 在选中节点之间均匀分配水平间距。
   *
   * 仅当选中节点 ≥ 3 时生效：按 x 坐标排序后，在首尾节点之间均匀插入中间节点。
   */
  function distributeHorizontal(): void {
    const nodes = getSelectedNodes();
    if (nodes.length < 3) return;
    const sorted = [...nodes].sort((a, b) => a.x - b.x);
    const totalWidth = sorted.reduce((sum, n) => sum + n.width, 0);
    const span = sorted[sorted.length - 1].x + sorted[sorted.length - 1].width - sorted[0].x;
    const gap = (span - totalWidth) / (sorted.length - 1);
    let cursor = sorted[0].x;
    sorted.forEach((n) => {
      lfGetter()?.updateNode(n.id, { x: cursor });
      cursor += n.width + gap;
    });
  }

  /**
   * 垂直分布 —— 在选中节点之间均匀分配垂直间距。
   *
   * 仅当选中节点 ≥ 3 时生效：按 y 坐标排序后，在首尾节点之间均匀插入中间节点。
   */
  function distributeVertical(): void {
    const nodes = getSelectedNodes();
    if (nodes.length < 3) return;
    const sorted = [...nodes].sort((a, b) => a.y - b.y);
    const totalHeight = sorted.reduce((sum, n) => sum + n.height, 0);
    const span = sorted[sorted.length - 1].y + sorted[sorted.length - 1].height - sorted[0].y;
    const gap = (span - totalHeight) / (sorted.length - 1);
    let cursor = sorted[0].y;
    sorted.forEach((n) => {
      lfGetter()?.updateNode(n.id, { y: cursor });
      cursor += n.height + gap;
    });
  }

  return {
    getSelectedNodes,
    alignLeft,
    alignCenter,
    alignRight,
    alignTop,
    alignMiddle,
    alignBottom,
    distributeHorizontal,
    distributeVertical,
  };
}

export type { SelectedNodeInfo };
