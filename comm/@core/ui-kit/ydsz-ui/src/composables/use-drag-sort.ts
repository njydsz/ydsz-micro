// cspell:words draggable
/**
 * useDragSort —— 通用列表拖拽排序 composable。
 *
 * <p>适用于任何需要手动重排的场景：表格行、树节点、卡片列表、菜单排序等。
 * 通过 Pointer Events 实现，不引入第三方依赖。
 *
 * <p>核心能力：
 * <ul>
 *   <li>拖拽时实时计算落点索引并触发视觉反馈</li>
 *   <li>支持 disabled 项跳过（通过 canDrag 回调）</li>
 *   <li>配置拖拽方向（horizontal | vertical），默认 vertical</li>
 *   <li>阈值过滤：微动不触发，避免与点击事件冲突</li>
 * </ul>
 *
 * <p>典型用法：
 * <pre>
 *   const { dragState, getListProps, getItemProps } = useDragSort({
 *     items: () => list.value,
 *     onReorder: ({ from, to }) => reorder(list.value, from, to),
 *   });
 * </pre>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-drag-sort.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import type { MaybeRef } from 'vue';

import { computed, ref, unref } from 'vue';

/** 排序方向 */
export type DragSortDirection = 'horizontal' | 'vertical';

/** 拖拽态 */
export interface DragSortState {
  /** 是否正在拖拽 */
  isDragging: boolean;
  /** 起始索引 */
  fromIndex: number;
  /** 当前悬停索引（实时） */
  toIndex: number;
}

/** 重排事件载荷 */
export interface ReorderPayload {
  from: number;
  to: number;
}

/** 配置项 */
export interface UseDragSortOptions {
  /** 列表数据 */
  items: MaybeRef<unknown[]> | (() => unknown[]);
  /** 拖拽方向 */
  direction?: DragSortDirection;
  /** 触发拖拽的最小位移（px），默认 3 */
  threshold?: number;
  /** 判定某项是否允许拖拽（返回 false 跳过） */
  canDrag?: (index: number) => boolean;
  /** 拖拽列表容器选择器（用于 getBoundingClientRect 定位） */
  containerSelector?: string;
  /** 完成重排时回调 */
  onReorder: (payload: ReorderPayload) => void;
}

/**
 * useDragSort：通用列表拖拽排序。
 *
 * @param options - 配置项
 * @return API 句柄
 */
export function useDragSort(options: UseDragSortOptions) {
  const {
    items,
    direction = 'vertical',
    threshold = 3,
    canDrag,
    containerSelector,
    onReorder,
  } = options;

  const state = ref<DragSortState>({
    fromIndex: -1,
    isDragging: false,
    toIndex: -1,
  });

  let startPos = 0;
  let pointerId: number | null = null;

  /** 读取列表 */
  const resolvedItems = computed(() => {
    if (typeof items === 'function') return items();
    return unref(items);
  });

  /**
   * 根据指针坐标计算当前索引。
   */
  function getIndexAt(clientX: number, clientY: number): number {
    const selector = containerSelector ?? '[data-drag-sort-item]';
    const els = document.querySelectorAll<HTMLElement>(selector);
    for (let i = 0; i < els.length; i++) {
      const rect = els[i].getBoundingClientRect();
      if (direction === 'vertical') {
        if (clientY >= rect.top && clientY <= rect.bottom) {
          return i;
        }
      } else {
        if (clientX >= rect.left && clientX <= rect.right) {
          return i;
        }
      }
    }
    return -1;
  }

  /**
   * 指针按下。
   */
  function handlePointerDown(event: PointerEvent, index: number): void {
    if (canDrag && !canDrag(index)) return;
    pointerId = event.pointerId;
    startPos = direction === 'vertical' ? event.clientY : event.clientX;
    state.value = {
      fromIndex: index,
      isDragging: false,
      toIndex: index,
    };
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  }

  /**
   * 指针移动。
   */
  function handlePointerMove(event: PointerEvent): void {
    if (pointerId === null) return;
    const currentPos = direction === 'vertical' ? event.clientY : event.clientX;
    const delta = Math.abs(currentPos - startPos);
    if (delta < threshold) return;

    state.value.isDragging = true;
    const target = getIndexAt(event.clientX, event.clientY);
    if (target >= 0 && target !== state.value.toIndex) {
      state.value.toIndex = target;
    }
  }

  /**
   * 指针抬起。
   */
  function handlePointerUp(): void {
    const { fromIndex, isDragging, toIndex } = state.value;
    if (isDragging && fromIndex !== toIndex) {
      onReorder({ from: fromIndex, to: toIndex });
    }
    state.value = {
      fromIndex: -1,
      isDragging: false,
      toIndex: -1,
    };
    pointerId = null;
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', handlePointerUp);
  }

  /**
   * 列表容器 props（注入 data 属性与事件）。
   */
  function getListProps(): Record<string, unknown> {
    return {
      'data-drag-sort-list': '',
    };
  }

  /**
   * 拖拽句柄 props（td 上使用）。
   *
   * @param index - 当前项索引
   */
  function getItemProps(index: number): Record<string, unknown> {
    return {
      'data-drag-sort-item': '',
      'data-dragging': state.value.isDragging && state.value.fromIndex === index,
      'data-drag-over': state.value.isDragging && state.value.toIndex === index && state.value.fromIndex !== index,
      style: {
        cursor: canDrag && !canDrag(index) ? 'not-allowed' : 'grab',
        userSelect: 'none',
      },
      onPointerdown: (event: PointerEvent) => handlePointerDown(event, index),
    };
  }

  return {
    dragState: state,
    getItemProps,
    getListProps,
  };
}
