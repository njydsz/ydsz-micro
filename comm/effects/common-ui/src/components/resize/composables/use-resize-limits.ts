/**
 * use-resize 约束/限制计算
 *
 * 从 use-resize-core.ts 拆分的纯计算函数（拖拽限制、调整大小限制、宽高比修正）。
 * 不含事件处理与状态更新副作用。
 *
 * @path comm\effects\common-ui\src\components\resize\composables\use-resize-limits.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { type Ref } from 'vue';

import type {
  DimensionsBeforeMove,
  Limits,
  RectCorrectionInput,
} from './use-resize-types';

/** 根据宽高比修正矩形 */
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

/** 计算拖拽限制 */
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

/** 计算调整大小限制 */
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
