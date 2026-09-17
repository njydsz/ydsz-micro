/**
 * useColumnResize —— 表格列宽拖拽调整 composable。
 *
 * 设计目标：
 *  - 通过 Pointer Events 在表头右侧边缘实现列宽拖拽；
 *  - 列宽变更实时反映到单元格 style.width；
 *  - 列宽受最小宽度钳制（默认 60px）；
 *  - 暴露 columnWidths ref，供外部持久化（localStorage / 远端）；
 *  - 支持鼠标 / 触摸双输入（Pointer Events 统一抽象）。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\table\useColumnResize.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { Ref } from 'vue';

import { computed, ref } from 'vue';

/** 列宽状态表：prop → px */
export type ColumnWidthMap = Ref<Record<string, number>>;

/** useColumnResize 配置 */
export interface UseColumnResizeOptions {
  /** 初始列宽表（prop → px） */
  initialWidths?: Record<string, number>;
  /** 默认最小宽度（px），默认 60 */
  defaultMinWidth?: number;
}

/** 拖拽状态 */
interface ResizeState {
  active: boolean;
  currentProp: string | null;
  startX: number;
  startWidth: number;
}

/**
 * useColumnResize —— 创建列宽拖拽句柄。
 *
 * @param options - 配置
 * @return 列宽操作句柄集合
 */
export function useColumnResize(options: UseColumnResizeOptions = {}) {
  const { initialWidths = {}, defaultMinWidth = 60 } = options;

  /** 内部列宽状态 */
  const columnWidths = ref<Record<string, number>>({ ...initialWidths });

  /** 拖拽进行中状态 */
  const resizeState = ref<ResizeState>({
    active: false,
    currentProp: null,
    startWidth: 0,
    startX: 0,
  });

  /** 是否正在拖拽 */
  const isResizing = computed(() => resizeState.value.active);

  /** 当前被拖拽的列 prop */
  const resizingProp = computed(() => resizeState.value.currentProp);

  /**
   * 处理拖拽开始。
   *
   * @param prop - 列 prop
   * @param event - PointerDown 事件
   */
  function onResizeStart(prop: string, event: PointerEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const currentWidth = columnWidths.value[prop] ?? 0;
    resizeState.value = {
      active: true,
      currentProp: prop,
      startWidth: currentWidth,
      startX: event.clientX,
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  /**
   * 处理拖拽移动（在 document/window 上挂载 @pointermove）。
   */
  function onResizeMove(event: PointerEvent): void {
    if (!resizeState.value.active || !resizeState.value.currentProp) return;

    const delta = event.clientX - resizeState.value.startX;
    const newWidth = Math.max(defaultMinWidth, resizeState.value.startWidth + delta);
    columnWidths.value[resizeState.value.currentProp] = newWidth;
  }

  /**
   * 处理拖拽结束。
   */
  function onResizeEnd(): void {
    resizeState.value = {
      active: false,
      currentProp: null,
      startWidth: 0,
      startX: 0,
    };
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }

  /**
   * 获取某列的当前宽度 style。
   */
  function getColumnWidthStyle(prop: string): string | undefined {
    const w = columnWidths.value[prop];
    if (w != null && w > 0) return `${w}px`;
    return undefined;
  }

  return {
    columnWidths,
    getColumnWidthStyle,
    isResizing,
    onResizeEnd,
    onResizeMove,
    onResizeStart,
    resizingProp,
  };
}
