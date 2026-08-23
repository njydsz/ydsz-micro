/**
 * @file use-resize 计算工具函数
 * @author YDSZ Team
 * @since 2026-08-23
 * @description 从 use-resize.ts 中拆出的纯计算函数，降低单文件大小
 */

import type { Ref } from 'vue';
import type {
  Limits,
  Rect,
  RectCorrectionInput,
} from './use-resize-types';

/**
 * 根据限制修正单侧值
 */
export function sideCorrectionByLimit(
  limit: { max: number; min: number },
  current: number,
): number {
  let value = current;

  if (limit.min !== null && current < limit.min) {
    value = limit.min;
  } else if (limit.max !== null && limit.max < current) {
    value = limit.max;
  }

  return value;
}

/**
 * 根据限制修正矩形
 */
export function rectCorrectionByLimit(
  rect: RectCorrectionInput,
  limits: Ref<Limits>,
): { newLeft: number; newRight: number; newTop: number; newBottom: number } {
  let { newRight, newLeft, newBottom, newTop } = rect;

  type RectRange = {
    max: number;
    min: number;
  };

  newLeft = sideCorrectionByLimit(limits.value.left as RectRange, newLeft);
  newRight = sideCorrectionByLimit(limits.value.right as RectRange, newRight);
  newTop = sideCorrectionByLimit(limits.value.top as RectRange, newTop);
  newBottom = sideCorrectionByLimit(limits.value.bottom as RectRange, newBottom);

  return {
    newLeft,
    newRight,
    newTop,
    newBottom,
  };
}
