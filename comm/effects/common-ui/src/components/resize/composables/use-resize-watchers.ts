/**
 * Resize 组件 Watchers
 *
 * @path comm\effects\common-ui\src\components\resize\composables\use-resize-watchers.ts
 * @author ydsz-team
 * @since 1.0.0
 *
 * @remarks
 * 将 resize 组件的 watchers 逻辑提取到独立 composable，
 * 以控制单文件行数符合云顶编码规范（≤400 行）。
 */

import { nextTick, watch } from 'vue';

import type { EmitFn } from './use-resize-events';
import {
  bodyDown,
  bodyMove,
  bodyUp,
  calcDragLimitation,
  calcResizeLimits,
  saveDimensionsBeforeMove,
  stickDown,
  stickMove,
  stickUp,
} from './use-resize';
import type { ResizeState } from './use-resize';

/** Rect 类型 */
interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * 设置 Resize 组件的所有 watchers
 *
 * @param refs - 组件响应式引用
 * @param resizeState - 核心逻辑状态对象
 * @param rect - 计算后的矩形对象
 * @param emit - 事件发射函数
 */
export function useResizeWatchers(
  refs: {
    x: { value: number };
    y: { value: number };
    w: { value: string | number };
    h: { value: string | number };
    z: { value: string | number };
    parentW: { value: number };
    parentH: { value: number };
    isActive: { value: boolean };
  },
  resizeState: ResizeState,
  rect: Rect,
  emit: EmitFn,
): void {
  const { x, y, w, h, z, parentW, parentH, isActive } = refs;

  // Watch: active state
  watch(
    () => resizeState.active.value,
    (active) => {
      if (active) {
        emit('activated');
      } else {
        emit('deactivated');
      }
    },
  );

  // Watch: isActive prop
  watch(
    () => isActive.value,
    (val) => {
      resizeState.active.value = val;
    },
    { immediate: true },
  );

  // Watch: z prop
  watch(
    () => z.value,
    (val) => {
      if ((val as number) >= 0 || val === 'auto') {
        resizeState.zIndex.value = val as number;
      }
    },
    { immediate: true },
  );

  // Watch: x prop
  watch(
    () => x.value,
    (newVal, oldVal) => {
      if (
        resizeState.stickDrag.value ||
        resizeState.bodyDrag.value ||
        newVal === resizeState.left.value
      ) {
        return;
      }

      const delta = oldVal - newVal;

      bodyDown(
        {
          pageX: resizeState.left.value!,
          pageY: resizeState.top.value!,
        } as MouseEvent & TouchEvent,
        resizeState,
        saveDimensionsBeforeMove,
        calcDragLimitation,
        emit,
      );
      bodyMove({ x: delta, y: 0 }, resizeState, rect as any, emit);

      nextTick(() => {
        bodyUp(resizeState, rect as any, emit);
      });
    },
  );

  // Watch: y prop
  watch(
    () => y.value,
    (newVal, oldVal) => {
      if (
        resizeState.stickDrag.value ||
        resizeState.bodyDrag.value ||
        newVal === resizeState.top.value
      ) {
        return;
      }

      const delta = oldVal - newVal;

      bodyDown(
        {
          pageX: resizeState.left.value,
          pageY: resizeState.top.value,
        } as MouseEvent & TouchEvent,
        resizeState,
        saveDimensionsBeforeMove,
        calcDragLimitation,
        emit,
      );
      bodyMove({ x: 0, y: delta }, resizeState, rect as any, emit);

      nextTick(() => {
        bodyUp(resizeState, rect as any, emit);
      });
    },
  );

  // Watch: w prop
  watch(
    () => w.value,
    (newVal, oldVal) => {
      if (
        resizeState.stickDrag.value ||
        resizeState.bodyDrag.value ||
        newVal === resizeState.width.value
      ) {
        return;
      }

      const stick = 'mr';
      const delta = (oldVal as number) - (newVal as number);

      stickDown(
        stick,
        {
          pageX: resizeState.right.value,
          pageY: resizeState.top.value! + resizeState.height.value / 2,
        } as MouseEvent & TouchEvent,
        resizeState,
        saveDimensionsBeforeMove,
        calcResizeLimits,
        true,
      );
      stickMove({ x: delta, y: 0 }, resizeState, rect as any, emit);

      nextTick(() => {
        stickUp(resizeState, rect as any, emit);
      });
    },
  );

  // Watch: h prop
  watch(
    () => h.value,
    (newVal, oldVal) => {
      if (
        resizeState.stickDrag.value ||
        resizeState.bodyDrag.value ||
        newVal === resizeState.height.value
      ) {
        return;
      }

      const stick = 'bm';
      const delta = (oldVal as number) - (newVal as number);

      stickDown(
        stick,
        {
          pageX: resizeState.left.value! + resizeState.width.value / 2,
          pageY: resizeState.right.value,
        } as MouseEvent & TouchEvent,
        resizeState,
        saveDimensionsBeforeMove,
        calcResizeLimits,
        true,
      );
      stickMove({ x: 0, y: delta }, resizeState, rect as any, emit);

      nextTick(() => {
        stickUp(resizeState, rect as any, emit);
      });
    },
  );

  // Watch: parentW prop
  watch(
    () => parentW.value,
    (val) => {
      resizeState.right.value =
        val - resizeState.width.value - resizeState.left.value!;
      resizeState.parentWidth.value = val;
    },
  );

  // Watch: parentH prop
  watch(
    () => parentH.value,
    (val) => {
      resizeState.bottom.value =
        val - resizeState.height.value - resizeState.top.value!;
      resizeState.parentHeight.value = val;
    },
  );
}
