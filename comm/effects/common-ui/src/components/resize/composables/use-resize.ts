/**
 * use-resize 拖拽/调整大小核心逻辑
 *
 * 主入口文件 — 重新导出核心模块（符合云顶规范 §15.1 文件行数限制）。
 * 核心逻辑已拆分为：
 * - use-resize-types.ts    : 类型声明
 * - use-resize-style.ts    : 样式映射常量
 * - use-resize-utils.ts    : 计算工具函数
 * - use-resize-core.ts     : 核心拖拽/调整逻辑
 * - use-resize-events.ts   : 事件处理函数
 *
 * @path comm\effects\common-ui\src\components\resize\composables\use-resize.ts
 * @author ydsz-team
 * @since 1.0.0
 */

// ==================== 类型导出 ====================
export type {
  DimensionsBeforeMove,
  Limit,
  Limits,
  Rect,
  RectCorrectionInput,
  ResizeState,
  Stick,
} from './use-resize-types';

// ==================== 样式映射 ====================
export { styleMapping } from './use-resize-style';

// ==================== 计算工具 ====================
export { rectCorrectionByLimit, sideCorrectionByLimit } from './use-resize-utils';

// ==================== 核心拖拽/调整逻辑 ====================
export {
  bodyMove,
  bodyUp,
  calcDragLimitation,
  calcResizeLimits,
  createPositionStyle,
  createSizeStyle,
  createStickStyles,
  deselect,
  rectCorrectionByAspectRatio,
  saveDimensionsBeforeMove,
  stickMove,
  stickUp,
} from './use-resize-core';

// ==================== 事件处理 ====================
export { addEvents, bodyDown, move, removeEvents, stickDown, up } from './use-resize-events';
export type { EmitFn } from './use-resize-events';
