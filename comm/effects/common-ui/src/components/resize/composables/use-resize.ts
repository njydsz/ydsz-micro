/**
 * use-resize 拖拽/调整大小核心逻辑
 *
 * @path comm\effects\common-ui\src\components\resize\composables\use-resize.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { type Ref, computed, getCurrentInstance } from 'vue';

// ==================== 类型导出 ====================
// 类型声明已剥离至 use-resize-types.ts（云顶规范 §15.1：类型声明单独组织）
export type {
  DimensionsBeforeMove,
  Limit,
  Limits,
  Rect,
  RectCorrectionInput,
  Stick,
} from './use-resize-types';

// ==================== 样式映射 ====================
// 样式映射已剥离至 use-resize-style.ts（云顶规范 §15.1：常量单独组织）
export { styleMapping } from './use-resize-style';

// ==================== 计算工具 ====================
// 计算函数已剥离至 use-resize-utils.ts（云顶规范 §15.1：大文件拆分）
export { rectCorrectionByLimit, sideCorrectionByLimit } from './use-resize-utils';

// ==================== 核心拖拽/调整逻辑 ====================

/**
 * 保存移动前的尺寸信息
 */
export function saveDimensionsBeforeMove(
  pointerX: number,
  pointerY: number,
  state: {
    left: Ref<null | number>;
    right: Ref<null | number>;
    top: Ref<null | number>;
    bottom: Ref<null | number>;
    width: Ref<null | number>;
    height: Ref<null | number>;
    aspectFactor: Ref<null | number>;
    dimensionsBeforeMove: Ref<DimensionsBeforeMove>;
  },
) {
  state.dimensionsBeforeMove.value.pointerX = pointerX;
  state.dimensionsBeforeMove.value.pointerY = pointerY;

  state.dimensionsBeforeMove.value.left = state.left.value as number;
  state.dimensionsBeforeMove.value.right = state.right.value as number;
  state.dimensionsBeforeMove.value.top = state.top.value as number;
  state.dimensionsBeforeMove.value.bottom = state.bottom.value as number;

  state.dimensionsBeforeMove.value.width = state.width.value as number;
  state.dimensionsBeforeMove.value.height = state.height.value as number;

  state.aspectFactor.value = state.width.value / state.height.value;
}

// sideCorrectionByLimit / rectCorrectionByLimit 已剥离至 use-resize-utils.ts

/**
 * 根据宽高比修正矩形
 */
export function rectCorrectionByAspectRatio(
  rect: RectCorrectionInput,
  state: {
    parentWidth: Ref<null | number>;
    parentHeight: Ref<null | number>;
    currentStick: Ref<null | string>;
    aspectFactor: Ref<null | number>;
    dimensionsBeforeMove: Ref<DimensionsBeforeMove>;
    width: Ref<null | number>;
    height: Ref<null | number>;
  },
) {
  let { newLeft, newRight, newTop, newBottom } = rect;

  let newWidth = state.parentWidth.value! - newLeft - newRight;
  let newHeight = state.parentHeight.value! - newTop - newBottom;

  if (state.currentStick.value![1] === 'm') {
    const deltaHeight = newHeight - state.dimensionsBeforeMove.value.height;

    newLeft -= (deltaHeight * state.aspectFactor.value!) / 2;
    newRight -= (deltaHeight * state.aspectFactor.value!) / 2;
  } else if (state.currentStick.value![0] === 'm') {
    const deltaWidth = newWidth - state.dimensionsBeforeMove.value.width;

    newTop -= deltaWidth / state.aspectFactor.value! / 2;
    newBottom -= deltaWidth / state.aspectFactor.value! / 2;
  } else if (newWidth / newHeight > state.aspectFactor.value!) {
    newWidth = state.aspectFactor.value! * newHeight;

    if (state.currentStick.value![1] === 'l') {
      newLeft = state.parentWidth.value! - newRight - newWidth;
    } else {
      newRight = state.parentWidth.value! - newLeft - newWidth;
    }
  } else {
    newHeight = newWidth / state.aspectFactor.value!;

    if (state.currentStick.value![0] === 't') {
      newTop = state.parentHeight.value! - newBottom - newHeight;
    } else {
      newBottom = state.parentHeight.value! - newTop - newHeight;
    }
  }

  return { newLeft, newRight, newTop, newBottom };
}

/**
 * 手柄移动处理
 */
export function stickMove(
  delta: { x: number; y: number },
  state: {
    dimensionsBeforeMove: Ref<DimensionsBeforeMove>;
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
    parentLimitation: Ref<boolean>;
    minw: Ref<number>;
    minh: Ref<number>;
    aspectFactor: Ref<null | number>;
  },
  rect: Ref<Rect>,
  emit: (event: 'resizing', rect: Rect) => void,
) {
  let newTop = state.dimensionsBeforeMove.value.top;
  let newBottom = state.dimensionsBeforeMove.value.bottom;
  let newLeft = state.dimensionsBeforeMove.value.left;
  let newRight = state.dimensionsBeforeMove.value.right;

  switch (state.currentStick.value![0]) {
    case 'b': {
      newBottom = state.dimensionsBeforeMove.value.bottom + delta.y;

      if (state.snapToGrid.value) {
        newBottom =
          (state.parentHeight.value as number) -
          Math.round(
            ((state.parentHeight.value as number) - newBottom) / state.gridY.value,
          ) *
            state.gridY.value;
      }

      break;
    }

    case 't': {
      newTop = state.dimensionsBeforeMove.value.top - delta.y;

      if (state.snapToGrid.value) {
        newTop = Math.round(newTop / state.gridY.value) * state.gridY.value;
      }

      break;
    }
    default: {
      break;
    }
  }

  switch (state.currentStick.value![1]) {
    case 'l': {
      newLeft = state.dimensionsBeforeMove.value.left - delta.x;

      if (state.snapToGrid.value) {
        newLeft = Math.round(newLeft / state.gridX.value) * state.gridX.value;
      }

      break;
    }

    case 'r': {
      newRight = state.dimensionsBeforeMove.value.right + delta.x;

      if (state.snapToGrid.value) {
        newRight =
          (state.parentWidth.value as number) -
          Math.round(((state.parentWidth.value as number) - newRight) / state.gridX.value) *
            state.gridX.value;
      }

      break;
    }
    default: {
      break;
    }
  }

  ({ newLeft, newRight, newTop, newBottom } = rectCorrectionByLimit(
    { newLeft, newRight, newTop, newBottom },
    state.limits,
  ));

  if (state.aspectRatio.value) {
    ({ newLeft, newRight, newTop, newBottom } = rectCorrectionByAspectRatio(
      { newLeft, newRight, newTop, newBottom },
      state,
    ));
  }

  state.left.value = newLeft;
  state.right.value = newRight;
  state.top.value = newTop;
  state.bottom.value = newBottom;

  emit('resizing', rect.value);
}

/**
 * 手柄释放处理
 */
export function stickUp(
  state: {
    stickDrag: Ref<boolean>;
    dimensionsBeforeMove: Ref<DimensionsBeforeMove>;
    limits: Ref<Limits>;
  },
  rect: Ref<Rect>,
  emit: (event: 'resizing' | 'resizestop', rect: Rect) => void,
) {
  state.stickDrag.value = false;

  Object.assign(state.dimensionsBeforeMove.value, {
    pointerX: 0,
    pointerY: 0,
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  });

  state.limits.value = {
    left: { min: null, max: null },
    right: { min: null, max: null },
    top: { min: null, max: null },
    bottom: { min: null, max: null },
  };

  emit('resizing', rect.value);
  emit('resizestop', rect.value);
}

/**
 * 计算拖拽限制
 */
export function calcDragLimitation(
  state: {
    parentWidth: Ref<null | number>;
    parentHeight: Ref<null | number>;
    width: Ref<null | number>;
    height: Ref<null | number>;
  },
): Limits {
  return {
    left: { min: 0, max: (state.parentWidth.value as number) - (state.width.value as number) },
    right: { min: 0, max: (state.parentWidth.value as number) - (state.width.value as number) },
    top: { min: 0, max: (state.parentHeight.value as number) - (state.height.value as number) },
    bottom: { min: 0, max: (state.parentHeight.value as number) - (state.height.value as number) },
  };
}

/**
 * 计算调整大小限制
 */
export function calcResizeLimits(
  state: {
    parentLimitation: Ref<boolean>;
    aspectRatio: Ref<boolean>;
    minw: Ref<number>;
    minh: Ref<number>;
    aspectFactor: Ref<null | number>;
    left: Ref<null | number>;
    right: Ref<null | number>;
    top: Ref<null | number>;
    bottom: Ref<null | number>;
    width: Ref<null | number>;
    height: Ref<null | number>;
    currentStick: Ref<null | string>;
  },
): Limits {
  const parentLim = state.parentLimitation.value ? 0 : null;

  if (state.aspectRatio.value) {
    if (state.minw.value / state.minh.value > (state.aspectFactor.value as number)) {
      state.minh.value = state.minw.value / (state.aspectFactor.value as number);
    } else {
      state.minw.value = ((state.aspectFactor.value as number) * state.minh.value) as number;
    }
  }

  const limits: Limits = {
    left: {
      min: parentLim,
      max: (state.left.value as number) + ((state.width.value as number) - state.minw.value),
    },
    right: {
      min: parentLim,
      max: (state.right.value as number) + ((state.width.value as number) - state.minw.value),
    },
    top: {
      min: parentLim,
      max: (state.top.value as number) + ((state.height.value as number) - state.minh.value),
    },
    bottom: {
      min: parentLim,
      max: (state.bottom.value as number) + ((state.height.value as number) - state.minh.value),
    },
  };

  if (state.aspectRatio.value) {
    const aspectLimits = {
      left: {
        min:
          state.left.value! -
          Math.min(state.top.value!, state.bottom.value!) * state.aspectFactor.value! * 2,
        max:
          state.left.value! +
          (((state.height.value as number) - state.minh.value!) / 2) * state.aspectFactor.value! * 2,
      },
      right: {
        min:
          state.right.value! -
          Math.min(state.top.value!, state.bottom.value!) * state.aspectFactor.value! * 2,
        max:
          state.right.value! +
          (((state.height.value as number) - state.minh.value!) / 2) * state.aspectFactor.value! * 2,
      },
      top: {
        min:
          state.top.value! -
          (Math.min(state.left.value!, state.right.value!) / state.aspectFactor.value!) * 2,
        max:
          state.top.value! +
          (((state.width.value as number) - state.minw.value) / 2 / state.aspectFactor.value!) * 2,
      },
      bottom: {
        min:
          state.bottom.value! -
          (Math.min(state.left.value!, state.right.value!) / state.aspectFactor.value!) * 2,
        max:
          state.bottom.value! +
          (((state.width.value as number) - state.minw.value) / 2 / state.aspectFactor.value!) * 2,
      },
    };

    if (state.currentStick.value![0] === 'm') {
      limits.left = {
        min: Math.max(limits.left.min!, aspectLimits.left.min),
        max: Math.min(limits.left.max, aspectLimits.left.max),
      };
      limits.right = {
        min: Math.max(limits.right.min!, aspectLimits.right.min),
        max: Math.min(limits.right.max, aspectLimits.right.max),
      };
    } else if (state.currentStick.value![1] === 'm') {
      limits.top = {
        min: Math.max(limits.top.min!, aspectLimits.top.min),
        max: Math.min(limits.top.max, aspectLimits.top.max),
      };
      limits.bottom = {
        min: Math.max(limits.bottom.min!, aspectLimits.bottom.min),
        max: Math.min(limits.bottom.max, aspectLimits.bottom.max),
      };
    }
  }

  return limits;
}

/**
 * 计算位置样式
 */
export function createPositionStyle(state: {
  top: Ref<null | number>;
  left: Ref<null | number>;
  zIndex: Ref<null | number>;
}) {
  return computed(() => ({
    top: `${state.top.value}px`,
    left: `${state.left.value}px`,
    zIndex: state.zIndex.value!,
  }));
}

/**
 * 计算尺寸样式
 */
export function createSizeStyle(
  w: Ref<string | number>,
  width: Ref<null | number>,
  h: Ref<string | number>,
  height: Ref<null | number>,
) {
  return computed(() => ({
    width: w.value === 'auto' ? 'auto' : `${width.value}px`,
    height: h.value === 'auto' ? 'auto' : `${height.value}px`,
  }));
}

/**
 * 计算手柄样式
 */
export function createStickStyles(
  stickSize: Ref<number>,
  parentScaleX: Ref<number>,
  parentScaleY: Ref<number>,
) {
  return computed(() => (stick: string) => {
    const stickStyle = {
      width: `${stickSize.value / parentScaleX.value}px`,
      height: `${stickSize.value / parentScaleY.value}px`,
    };
    stickStyle[
      styleMapping.y[stick[0] as 'b' | 'm' | 't'] as 'height' | 'width'
    ] = `${stickSize.value / parentScaleX.value / -2}px`;
    stickStyle[
      styleMapping.x[stick[1] as 'l' | 'm' | 'r'] as 'height' | 'width'
    ] = `${stickSize.value / parentScaleX.value / -2}px`;
    return stickStyle;
  });
}

/**
 * 拖拽移动处理
 */
export function bodyMove(
  delta: { x: number; y: number },
  state: {
    dimensionsBeforeMove: Ref<DimensionsBeforeMove>;
    snapToGrid: Ref<boolean>;
    parentHeight: Ref<null | number>;
    parentWidth: Ref<null | number>;
    gridY: Ref<number>;
    gridX: Ref<number>;
    left: Ref<null | number>;
    right: Ref<null | number>;
    top: Ref<null | number>;
    bottom: Ref<null | number>;
    width: Ref<null | number>;
    height: Ref<null | number>;
    limits: Ref<Limits>;
  },
  rect: Ref<Rect>,
  emit: (event: 'dragging', rect: Rect) => void,
) {
  let newTop = state.dimensionsBeforeMove.value.top - delta.y;
  let newBottom = state.dimensionsBeforeMove.value.bottom + delta.y;
  let newLeft = state.dimensionsBeforeMove.value.left - delta.x;
  let newRight = state.dimensionsBeforeMove.value.right + delta.x;

  if (state.snapToGrid.value) {
    let alignTop = true;
    let alignLeft = true;

    let diffT = newTop - Math.floor(newTop / state.gridY.value) * state.gridY.value;
    let diffB =
      (state.parentHeight.value as number) -
      newBottom -
      Math.floor(((state.parentHeight.value as number) - newBottom) / state.gridY.value) *
        state.gridY.value;
    let diffL = newLeft - Math.floor(newLeft / state.gridX.value) * state.gridX.value;
    let diffR =
      (state.parentWidth.value as number) -
      newRight -
      Math.floor(((state.parentWidth.value as number) - newRight) / state.gridX.value) *
        state.gridX.value;

    if (diffT > state.gridY.value / 2) {
      diffT -= state.gridY.value;
    }
    if (diffB > state.gridY.value / 2) {
      diffB -= state.gridY.value;
    }
    if (diffL > state.gridX.value / 2) {
      diffL -= state.gridX.value;
    }
    if (diffR > state.gridX.value / 2) {
      diffR -= state.gridX.value;
    }

    if (Math.abs(diffB) < Math.abs(diffT)) {
      alignTop = false;
    }
    if (Math.abs(diffR) < Math.abs(diffL)) {
      alignLeft = false;
    }

    newTop -= alignTop ? diffT : diffB;
    newBottom = (state.parentHeight.value as number) - (state.height.value as number) - newTop;
    newLeft -= alignLeft ? diffL : diffR;
    newRight = (state.parentWidth.value as number) - (state.width.value as number) - newLeft;
  }

  ({
    newLeft: state.left.value,
    newRight: state.right.value,
    newTop: state.top.value,
    newBottom: state.bottom.value,
  } = rectCorrectionByLimit({ newLeft, newRight, newTop, newBottom }, state.limits));

  emit('dragging', rect.value);
}

/**
 * 拖拽释放处理
 */
export function bodyUp(
  state: {
    bodyDrag: Ref<boolean>;
    dimensionsBeforeMove: Ref<DimensionsBeforeMove>;
    limits: Ref<Limits>;
  },
  rect: Ref<Rect>,
  emit: (event: 'dragging' | 'dragstop', rect: Rect) => void,
) {
  state.bodyDrag.value = false;
  emit('dragging', rect.value);
  emit('dragstop', rect.value);

  Object.assign(state.dimensionsBeforeMove.value, {
    pointerX: 0,
    pointerY: 0,
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  });

  state.limits.value = {
    left: { min: null, max: null },
    right: { min: null, max: null },
    top: { min: null, max: null },
    bottom: { min: null, max: null },
  };
}

/**
 * 手柄按下处理
 */
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

/**
 * 移动事件处理
 */
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
  stickMoveFn: typeof stickMove,
  bodyMoveFn: typeof bodyMove,
  rect: Ref<Rect>,
  emit: (event: 'resizing' | 'dragging', rect: Rect) => void,
) {
  if (!state.stickDrag.value && !state.bodyDrag.value) {
    return;
  }

  ev.stopPropagation();

  // touches 兼容性代码
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
    stickMoveFn(delta, state, rect, emit);
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
      // No default
    }
    bodyMoveFn(delta, state, rect, emit);
  }
}

/**
 * 释放事件处理
 */
export function up(
  state: {
    stickDrag: Ref<boolean>;
    bodyDrag: Ref<boolean>;
    dimensionsBeforeMove: Ref<DimensionsBeforeMove>;
    limits: Ref<Limits>;
  },
  stickUpFn: typeof stickUp,
  bodyUpFn: typeof bodyUp,
  rect: Ref<Rect>,
  emit: (event: 'resizing' | 'resizestop' | 'dragging' | 'dragstop', rect: Rect) => void,
) {
  if (state.stickDrag.value) {
    stickUpFn(state, rect, emit);
  } else if (state.bodyDrag.value) {
    bodyUpFn(state, rect, emit);
  }
}

/**
 * 取消选择处理
 */
export function deselect(
  state: {
    preventActiveBehavior: Ref<boolean>;
    active: Ref<boolean>;
  },
) {
  if (state.preventActiveBehavior.value) {
    return;
  }
  state.active.value = false;
}

/**
 * 拖拽按下处理
 */
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
  saveDimensions: typeof saveDimensionsBeforeMove,
  calcDragLim: typeof calcDragLimitation,
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

  saveDimensions(pointerX, pointerY, state);

  if (state.parentLimitation.value) {
    state.limits.value = calcDragLim(state);
  }
}
