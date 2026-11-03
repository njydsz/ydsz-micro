/**
 * useTreeDrag —— YdTreeTable 拖拽排序装配。
 *
 * <p>职责：
 * <ul>
 *   <li>封装 useDragSort 的树表专用配置（垂直方向、root 行可拖拽）</li>
 *   <li>拖拽状态读取（isDragging / fromIndex / toIndex）</li>
 *   <li>单元格 pointerdown → 委托给 dragApi</li>
 * </ul>
 *
 * <p>从 use-tree-table-core 提取，保持对外行为不变。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\tree-table\use-tree-drag.ts
 * @author ydsz-team
 * @since 26.10.17
 */

import type { TreeFlatRow, YdTreeTableEmits } from './types';
import type { ResolvedTreeTableProps } from './tree-table-shared-types';
import type { ComputedRef } from 'vue';

import { useDragSort } from '../../composables/use-drag-sort';

/** useTreeDrag 配置 */
export interface UseTreeDragOptions<T extends Record<string, unknown>> {
  /** 组件 props（响应式，已含默认值） */
  props: ResolvedTreeTableProps<T>;
  /** 组件 emits 触发器 */
  emit: YdTreeTableEmits;
  /** 当前可见扁平行 */
  flatRows: ComputedRef<TreeFlatRow<T>[]>;
}

/** useTreeDrag 返回句柄 */
export interface UseTreeDragReturn {
  /** 是否正在拖拽 */
  isDragging: () => boolean;
  /** 当前拖拽起始索引 */
  fromIndex: () => number;
  /** 当前拖拽落点索引 */
  toIndex: () => number;
  /** 单元格 pointerdown（仅 root 行开启拖拽） */
  onCellPointerDown: (event: PointerEvent, index: number) => void;
}

/**
 * 拖拽排序装配 composable。
 *
 * @param options - props / emit / flatRows
 * @returns 拖拽句柄
 */
export function useTreeDrag<T extends Record<string, unknown>>(
  options: UseTreeDragOptions<T>,
): UseTreeDragReturn {
  const { emit, props, flatRows } = options;

  const dragApi = useDragSort({
    items: () => flatRows.value,
    direction: 'vertical',
    threshold: 5,
    canDrag: (index) => {
      if (!props.draggable) return false;
      // 仅允许同层拖拽：限制 depth=0 才可拖拽
      return flatRows.value[index]?.depth === 0;
    },
    onReorder: ({ from, to }) => {
      emit('drag-end', from, to);
    },
  });

  /** 行拖拽（仅 root 行） */
  function handleRowDragDown(event: PointerEvent, index: number): void {
    const itemProps = dragApi.getItemProps(index) as { onPointerdown?: (e: PointerEvent) => void };
    if (typeof itemProps.onPointerdown === 'function') {
      itemProps.onPointerdown(event);
    }
  }

  /** 单元格 pointerdown —— 仅在 root 行第一列开启拖拽 */
  function onCellPointerDown(event: PointerEvent, index: number): void {
    if (!props.draggable) return;
    const fRow = flatRows.value[index];
    if (!fRow || fRow.depth !== 0) return;
    if (dragApi.dragState.value.isDragging) return;
    handleRowDragDown(event, index);
  }

  return {
    fromIndex: () => dragApi.dragState.value.fromIndex,
    isDragging: () => dragApi.dragState.value.isDragging,
    onCellPointerDown,
    toIndex: () => dragApi.dragState.value.toIndex,
  };
}
