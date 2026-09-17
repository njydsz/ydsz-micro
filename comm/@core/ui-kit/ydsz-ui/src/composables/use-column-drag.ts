/**
 * useColumnDrag —— 表格列拖拽排序 composable。
 *
 * <p>基于 Pointer Events 实现列顺序的手势重排，不引入第三方拖拽依赖，
 * 适用于 YdTable 列驱动模式下的列顺序持久化场景。
 *
 * <p>设计要点：
 * <ul>
 *   <li>纯指针事件监听，移动端 / 桌面端通用</li>
 *   <li>通过 threshold 阈值区分"点击排序"与"拖拽"</li>
 *   <li>视觉反馈通过 CSS class .yd-col-dragging / .yd-col-drag-over 钩子挂载</li>
 *   <li>返回的 onPointerDown 注入到表头 th 即完成绑定</li>
 * </ul>
 *
 * <p>典型用法：
 * <pre>
 *   const { dragState, onPointerDown, onPointerMove, onPointerUp } = useColumnDrag(
 *     () => props.columns,
 *     (from, to) => emit('columns-change', reorder(columns, from, to)),
 *   );
 * </pre>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-column-drag.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import type { MaybeRef } from 'vue';

import { computed, ref, unref } from 'vue';

/** 拖拽态 */
export interface ColumnDragState {
  /** 是否正在拖拽中 */
  isDragging: boolean;
  /** 起始列索引 */
  fromIndex: number;
  /** 目标列索引（实时） */
  toIndex: number;
}

/** 拖拽配置 */
export interface UseColumnDragOptions {
  /** 触发起始拖拽的最小位移（px），默认 4 */
  threshold?: number;
  /** 拖拽开始前校验（返回 false 则取消拖拽） */
  canDrag?: (fromIndex: number) => boolean;
}

/**
 * useColumnDrag：管理列拖拽整个生命周期。
 *
 * @param columns - 列数组（ref / getter）
 * @param onReorder - 拖拽完成后回调（fromIndex, toIndex）
 * @param options - 配置项
 * @return 拖拽状态与事件处理器
 */
export function useColumnDrag<T>(
  columns: MaybeRef<T[]> | (() => T[]),
  onReorder: (fromIndex: number, toIndex: number) => void,
  options: UseColumnDragOptions = {},
) {
  const { threshold = 4, canDrag } = options;

  /** 拖拽态 */
  const dragState = ref<ColumnDragState>({
    fromIndex: -1,
    isDragging: false,
    toIndex: -1,
  });

  /** 指针起始坐标 */
  let startX = 0;
  let startY = 0;
  let pointerId: number | null = null;

  /** 当前列数组（计算属性） */
  const resolvedColumns = computed(() => {
    if (typeof columns === 'function') return columns();
    return unref(columns);
  });

  /**
   * 查找指针下方的列索引。
   *
   * @param clientX - 指针 X 坐标
   * @return 命中的列索引或 -1
   */
  function getColumnIndexAt(clientX: number): number {
    const ths = document.querySelectorAll<HTMLElement('[data-col-drag]');
    for (let i = 0; i < ths.length; i++) {
      const rect = ths[i].getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right) {
        return i;
      }
    }
    return -1;
  }

  /**
   * 表头 th 指针按下：记录起始坐标，判断是否进入拖拽。
   *
   * @param event - PointerEvent
   * @param index - 当前列索引
   */
  function onPointerDown(event: PointerEvent, index: number): void {
    if (canDrag && !canDrag(index)) {
      return;
    }
    startX = event.clientX;
    startY = event.clientY;
    pointerId = event.pointerId;
    dragState.value = {
      fromIndex: index,
      isDragging: false,
      toIndex: index,
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  }

  /**
   * 指针移动：未达阈值前不激活；激活后实时更新目标索引。
   */
  function handlePointerMove(event: PointerEvent): void {
    if (pointerId === null) {
      return;
    }
    const dx = Math.abs(event.clientX - startX);
    const dy = Math.abs(event.clientY - startY);
    if (!dragState.value.isDragging && (dx < threshold && dy < threshold)) {
      return;
    }

    dragState.value.isDragging = true;
    const target = getColumnIndexAt(event.clientX);
    if (target >= 0 && target !== dragState.value.toIndex) {
      dragState.value.toIndex = target;
    }
  }

  /**
   * 指针抬起：触发重排回调，解除监听。
   */
  function handlePointerUp(): void {
    const { fromIndex, isDragging, toIndex } = dragState.value;
    if (isDragging && fromIndex >= 0 && toIndex >= 0 && fromIndex !== toIndex) {
      onReorder(fromIndex, toIndex);
    }
    dragState.value = {
      fromIndex: -1,
      isDragging: false,
      toIndex: -1,
    };
    pointerId = null;
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', handlePointerUp);
  }

  /**
   * 当前拖拽的目标索引（无拖拽返回 -1）。
   */
  const draggingToIndex = computed<number>(() =>
    dragState.value.isDragging ? dragState.value.toIndex : -1,
  );

  /** 当前拖拽起始索引 */
  const draggingFromIndex = computed<number>(() =>
    dragState.value.isDragging ? dragState.value.fromIndex : -1,
  );

  return {
    dragState,
    draggingFromIndex,
    draggingToIndex,
    onPointerDown,
  };
}
