/**
 * use-resize 类型定义
 *
 * 从 use-resize.ts 剥离的类型声明（云顶规范 §15.1：类型声明按模块单独组织）。
 * 纯类型文件，无执行逻辑，适用声明类文件豁免。
 *
 * @path comm/effects/common-ui/src/components/resize/composables/use-resize-types.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** 移动前记录的尺寸与位置快照 */
export interface DimensionsBeforeMove {
  pointerX: number;
  pointerY: number;
  x: number;
  y: number;
  w: number;
  h: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
}

/** 单方向限位 */
export interface Limit {
  min: null | number;
  max: null | number;
}

/** 四方向限位集合 */
export interface Limits {
  left: Limit;
  right: Limit;
  top: Limit;
  bottom: Limit;
}

/** 矩形几何 */
export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** 矩形校正输入 */
export interface RectCorrectionInput {
  newBottom: number;
  newLeft: number;
  newRight: number;
  newTop: number;
}

/** 拖拽手柄方位 */
export type Stick = 'bl' | 'bm' | 'br' | 'ml' | 'mr' | 'tl' | 'tm' | 'tr';
