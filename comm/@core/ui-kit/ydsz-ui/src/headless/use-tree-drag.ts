// cspell:words draggable
/**
 * useTreeDrag —— 树形组件拖拽排序 composable。
 *
 * 设计目标：
 *  - 在扁平化的 flattenedNodes 上实现拖拽重排；
 *  - 支持三种落点：before（上方插入）、after（下方插入）、inside（成为子节点）；
 *  - 悬停已折叠节点超过阈值后自动展开（autoExpandDelay）；
 *  - 落点深度由鼠标在节点内的水平偏移计算，靠近左边缘为 before，中间为 inside，右边缘为 after；
 *  - 所有状态以响应式 ref 暴露，供 YdTree 渲染拖拽指示器。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\headless\use-tree-drag.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import type { Ref } from 'vue';

import { ref } from 'vue';

/** 落点相对位置 */
export type TreeDropPosition = 'before' | 'inside' | 'after';

/** 拖拽状态 */
export interface TreeDragState {
  /** 是否正在拖拽 */
  isDragging: boolean;
  /** 被拖拽的节点 value */
  dragValue: string | number | null;
  /** 当前落点节点 value */
  overValue: string | number | null;
  /** 落点位置：before / inside / after */
  overPosition: TreeDropPosition;
}

/** 配置项 */
export interface UseTreeDragOptions<T> {
  /** 已展开的节点 Set（来自 useTreeHeadless） */
  expandedKeys: Ref<Set<string | number>>;
  /** 扁平化节点列表（来自 useTreeHeadless） */
  flattenedNodes: Ref<Array<{ data: T; level: number; hasChildren: boolean; value: string | number }>>;
  /** 节点唯一值获取函数 */
  getValue: (node: T) => string | number;
  /** 子节点获取函数 */
  getChildren: (node: T) => T[];
  /** 设置子节点函数（可变操作） */
  setChildren: (node: T, children: T[]) => void;
  /** 树数据（可变引用） */
  treeData: Ref<T[]>;
  /** 折叠节点自动展开延迟（ms），默认 600 */
  autoExpandDelay?: number;
  /** 判定节点是否允许拖拽 */
  canDrag?: (node: T) => boolean;
  /** 完成拖拽重排回调 */
  onReorder: (payload: { from: T; to: T; position: TreeDropPosition }) => void;
}

/**
 * useTreeDrag —— 创建树拖拽句柄。
 *
 * @param options - 配置项
 * @return 拖拽操作句柄
 */
export function useTreeDrag<T extends Record<string, unknown>>(
  options: UseTreeDragOptions<T>,
) {
  const {
    autoExpandDelay = 600,
    canDrag,
    expandedKeys,
    getChildren,
    getValue,
    onReorder,
    treeData,
  } = options;

  /** 拖拽状态 */
  const dragState = ref<TreeDragState>({
    dragValue: null,
    isDragging: false,
    overPosition: 'after',
    overValue: null,
  });

  /** 自动展开计时器 */
  let autoExpandTimer: ReturnType<typeof setTimeout> | null = null;

  /** 被拖拽节点的原始 DOM 节点宽度（用于落点计算） */
  let dragSourceWidth = 0;

  /**
   * 处理拖拽开始。
   *
   * @param node - 被拖拽节点
   * @param width - 节点 DOM 宽度
   */
  function startDrag(node: T, width: number): void {
    if (canDrag && !canDrag(node)) return;
    dragSourceWidth = width;
    dragState.value = {
      dragValue: getValue(node),
      isDragging: true,
      overPosition: 'after',
      overValue: null,
    };
  }

  /**
   * 计算落点位置。
   *
   * <p>水平偏移比例：
   *  - < 25% → before
   *  - 25% ~ 75% → inside（有子节点能力时）
   *  - > 75% → after
   */
  function getDropPosition(offsetX: number, targetHasChildren: boolean, targetIsExpanded: boolean): TreeDropPosition {
    const ratio = dragSourceWidth > 0 ? offsetX / dragSourceWidth : 0.5;
    if (ratio < 0.25) return 'before';
    if (ratio > 0.75) return 'after';
    // inside：只有目标有子节点或已展开时才允许
    if (targetHasChildren || targetIsExpanded) return 'inside';
    return 'after';
  }

  /**
   * 计算悬停节点（外部传入节点与水平偏移）。
   *
   * @param targetNode - 目标节点
   * @param offsetX - 鼠标在节点内的水平偏移
   */
  function handleDragOver(targetNode: T, offsetX: number): void {
    if (!dragState.value.isDragging) return;
    const targetValue = getValue(targetNode);
    if (targetValue === dragState.value.dragValue) return; // 不能拖到自己上

    const hasChildren = getChildren(targetNode).length > 0;
    const isExpanded = expandedKeys.value.has(targetValue);
    const position = getDropPosition(offsetX, hasChildren, isExpanded);

    dragState.value.overValue = targetValue;
    dragState.value.overPosition = position;

    // 自动展开折叠节点
    if (position === 'inside' && hasChildren && !isExpanded) {
      scheduleAutoExpand(targetValue);
    } else {
      cancelAutoExpand();
    }
  }

  /**
   * 安排自动展开。
   */
  function scheduleAutoExpand(value: string | number): void {
    if (autoExpandTimer) return;
    autoExpandTimer = setTimeout(() => {
      expandedKeys.value.add(value);
      autoExpandTimer = null;
    }, autoExpandDelay);
  }

  /**
   * 取消自动展开。
   */
  function cancelAutoExpand(): void {
    if (autoExpandTimer) {
      clearTimeout(autoExpandTimer);
      autoExpandTimer = null;
    }
  }

  /**
   * 结束拖拽 —— 执行重排回调并清理状态。
   */
  function endDrag(): void {
    cancelAutoExpand();
    const { dragValue, overValue, overPosition } = dragState.value;
    if (overValue !== null && dragValue !== null && overValue !== dragValue) {
      // 查找节点对象
      const fromNode = findNodeByValue(treeData.value, dragValue);
      const toNode = findNodeByValue(treeData.value, overValue);
      if (fromNode && toNode) {
        onReorder({ from: fromNode, position: overPosition, to: toNode });
      }
    }
    dragState.value = {
      dragValue: null,
      isDragging: false,
      overPosition: 'after',
      overValue: null,
    };
  }

  /**
   * 通过 value 定位节点。
   */
  function findNodeByValue(nodes: T[], value: string | number): T | null {
    for (const node of nodes) {
      if (getValue(node) === value) return node;
      const children = getChildren(node);
      if (children.length > 0) {
        const found = findNodeByValue(children, value);
        if (found) return found;
      }
    }
    return null;
  }

  return {
    cancelAutoExpand,
    dragState,
    endDrag,
    handleDragOver,
    startDrag,
  };
}
