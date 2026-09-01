/**
 * use-resize 事件处理函数
 *
 * 拖拽/调整大小的按下、移动、释放事件处理逻辑。
 * 从 use-resize.ts 拆分出来以符合云顶规范 §15.1（文件行数 ≤ 500 行）。
 *
 * @path comm\effects\common-ui\src\components\resize\composables\use-resize-events.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { type Ref, getCurrentInstance } from 'vue';

import type { DimensionsBeforeMove, Limits, Rect } from './use-resize-types';
import {
  bodyMove,
  bodyUp,
  calcDragLimitation,
  type calcResizeLimits,
  deselect,
  saveDimensionsBeforeMove,
  stickMove,
  stickUp,
} from './use-resize-core';

/** 事件处理器函数类型 */
type EventHandler = (ev: Event) => void;

/**
 * 批量添加 DOM 事件监听器（规范 5.5：生命周期配对管理）
 * @param domEvents - 事件名 -> 处理器映射
 * @param target - 目标元素（默认 document）
 */
export function addEvents(
  domEvents: Map<string, EventHandler>,
  target: HTMLElement | Document = document,
): void {
  domEvents.forEach((handler, eventName) => {
    target.addEventListener(eventName, handler as EventListener);
  });
}

/**
 * 批量移除 DOM 事件监听器（与 addEvents 配对）
 * @param domEvents - 事件名 -> 处理器映射
 * @param target - 目标元素（默认 document）
 */
export function removeEvents(
  domEvents: Map<string, EventHandler>,
  target: HTMLElement | Document = document,
): void {
  domEvents.forEach((handler, eventName) => {
    target.removeEventListener(eventName, handler as EventListener);
  });
}

/** Emit 函数类型（供 use-resize-watchers 引用） */
export type EmitFn = (
  event:
    | 'activated'
    | 'deactivated'
    | 'clicked'
    | 'resizing'
    | 'resizestop'
    | 'dragging'
    | 'dragstop',
  payload?: unknown,
) => void;

/** 手柄按下处理 */
export function stickDown(
  stick: string,
  ev: { pageX?: number; pageY?: number; touches?: { pageX: number; pageY: number }[] },
  state: {
    isResizable: Ref<boolean>;
    active: Ref<boolean>;
    stickDrag: Ref<boolean>;
    dimensionsBeforeMove: Ref<DimensionsBeforeMove>;
    currentStick: Ref<null | string>;
    limits: Ref<Limits>;
    parentLimitation: Ref<boolean>;
    minw: Ref<number>;
    minh: Ref<number>;
    aspectRatio: Ref<boolean>;
    aspectFactor: Ref<null | number>;
    left: Ref<null | number>;
    right: Ref<null | number>;
    top: Ref<null | number>;
    bottom: Ref<null | number>;
    width: Ref<null | number>;
    height: Ref<null | number>;
  },
  saveDimensions: typeof saveDimensionsBeforeMove,
  calcLimits: typeof calcResizeLimits,
  force = false,
) {
  if ((!state.isResizable.value || !state.active.value) && !force) {
    return;
  }

  state.stickDrag.value = true;

  const pointerX = ev.pageX === undefined ? ev.touches![0]!.pageX : ev.pageX;
  const pointerY = ev.pageY === undefined ? ev.touches![0]!.pageY : ev.pageY;

  saveDimensions(pointerX, pointerY, state);

  state.currentStick.value = stick;

  state.limits.value = calcLimits(state);
}

/** 移动事件处理 */
export function move(
  ev: MouseEvent | TouchEvent,
  state: {
    stickDrag: Ref<boolean>;
    bodyDrag: Ref<boolean>;
    dimensionsBeforeMove: Ref<DimensionsBeforeMove>;
    parentScaleX: Ref<number>;
    parentScaleY: Ref<number>;
    axis: Ref<string>;
    currentStick: Ref<null | string>;
    snapToGrid: Ref<boolean>;
    parentHeight: Ref<null | number>;
    parentWidth: Ref<null | number>;
    gridY: Ref<number>;
    gridX: Ref<number>;
    limits: Ref<Limits>;
    aspectRatio: Ref<boolean>;
    left: Ref<null | number>;
    right: Ref<null | number>;
    top: Ref<null | number>;
    bottom: Ref<null | number>;
    width: Ref<null | number>;
    height: Ref<null | number>;
    aspectFactor: Ref<null | number>;
  },
  rect: Ref<Rect>,
  emit: (event: 'resizing' | 'dragging', rect: Rect) => void,
) {
  if (!state.stickDrag.value && !state.bodyDrag.value) {
    return;
  }

  ev.stopPropagation();

  const mouseEvent = ev as MouseEvent;
  const touchEvent = ev as TouchEvent;
  const pageX = mouseEvent.pageX === undefined
    ? touchEvent.touches![0]!.pageX
    : mouseEvent.pageX;
  const pageY = mouseEvent.pageY === undefined
    ? touchEvent.touches![0]!.pageY
    : mouseEvent.pageY;

  const delta = {
    x: (state.dimensionsBeforeMove.value.pointerX - pageX) / state.parentScaleX.value,
    y: (state.dimensionsBeforeMove.value.pointerY - pageY) / state.parentScaleY.value,
  };

  if (state.stickDrag.value) {
    stickMove(delta, state, rect, emit);
  }

  if (state.bodyDrag.value) {
    switch (state.axis.value) {
      case 'none': {
        return;
      }
      case 'x': {
        delta.y = 0;
        break;
      }
      case 'y': {
        delta.x = 0;
        break;
      }
    }
    bodyMove(delta, state, rect, emit);
  }
}

/** 释放事件处理 */
export function up(
  state: {
    stickDrag: Ref<boolean>;
    bodyDrag: Ref<boolean>;
    dimensionsBeforeMove: Ref<DimensionsBeforeMove>;
    limits: Ref<Limits>;
  },
  rect: Ref<Rect>,
  emit: (event: 'resizing' | 'resizestop' | 'dragging' | 'dragstop', rect: Rect) => void,
) {
  if (state.stickDrag.value) {
    stickUp(state, rect, emit);
  } else if (state.bodyDrag.value) {
    bodyUp(state, rect, emit);
  }
}

/** 拖拽按下处理 */
export function bodyDown(
  ev: MouseEvent | TouchEvent,
  state: {
    preventActiveBehavior: Ref<boolean>;
    active: Ref<boolean>;
    dragHandle: Ref<string | null>;
    dragCancel: Ref<string | null>;
    isDraggable: Ref<boolean>;
    bodyDrag: Ref<boolean>;
    dimensionsBeforeMove: Ref<DimensionsBeforeMove>;
    parentLimitation: Ref<boolean>;
    limits: Ref<Limits>;
    left: Ref<null | number>;
    top: Ref<null | number>;
    width: Ref<null | number>;
    height: Ref<null | number>;
    parentWidth: Ref<null | number>;
    parentHeight: Ref<null | number>;
    minw: Ref<number>;
    minh: Ref<number>;
    aspectRatio: Ref<boolean>;
    aspectFactor: Ref<null | number>;
    right: Ref<null | number>;
    bottom: Ref<null | number>;
    currentStick: Ref<null | string>;
    stickDrag: Ref<boolean>;
  },
  emit: (event: 'clicked', ev: unknown) => void,
) {
  const { target, button } = ev as MouseEvent;

  if (!state.preventActiveBehavior.value) {
    state.active.value = true;
  }

  if (button && button !== 0) {
    return;
  }

  emit('clicked', ev);

  if (!state.active.value) {
    return;
  }

  const currentInstance = getCurrentInstance();
  const targetEl = target as HTMLElement;

  if (
    state.dragHandle.value &&
    targetEl.dataset.dragHandle !== currentInstance?.uid.toString()
  ) {
    return;
  }

  if (
    state.dragCancel.value &&
    targetEl.dataset.dragCancel === currentInstance?.uid.toString()
  ) {
    return;
  }

  if (ev.stopPropagation !== undefined) {
    ev.stopPropagation();
  }

  if (ev.preventDefault !== undefined) {
    ev.preventDefault();
  }

  if (state.isDraggable.value) {
    state.bodyDrag.value = true;
  }

  const mouseEvent = ev as MouseEvent;
  const touchEvent = ev as TouchEvent;
  const pointerX = mouseEvent.pageX === undefined
    ? touchEvent.touches![0]!.pageX
    : mouseEvent.pageX;
  const pointerY = mouseEvent.pageY === undefined
    ? touchEvent.touches![0]!.pageY
    : mouseEvent.pageY;

  saveDimensionsBeforeMove(pointerX, pointerY, state);

  if (state.parentLimitation.value) {
    state.limits.value = calcDragLimitation(state);
  }
}
