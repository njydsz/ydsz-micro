/**
 * Watermark 组件的 props 类型与辅助类型。
 *
 * @author ydsz-ai
 * @since 1.0.0
 */

/** 水印间距 [水平, 垂直] */
export type WatermarkGap = [number, number];

/** 水印偏移量 [水平, 垂直] */
export type WatermarkOffset = [number, number];

/**
 * Watermark 组件属性。
 *
 * @remarks
 * 组件通过 Canvas 将文字或图片绘制为 base64 dataURL，再作为 background-image
 * 平铺覆盖整个容器。可选择性开启 MutationObserver 防篡改监听。
 */
export interface WatermarkProps {
  /** 自定义 CSS class */
  class?: string;
  /** 水印文字内容（与 image 二选一，同时传 image 优先） */
  content?: string;
  /** 水印图片 URL（与 content 二选一，同时传 image 优先） */
  image?: string;
  /** 单个水印宽度（px） */
  width?: number;
  /** 单个水印高度（px） */
  height?: number;
  /** 旋转角度（负数为逆时针，单位 deg） */
  rotate?: number;
  /** 文字水印字号（px） */
  fontSize?: number;
  /** 文字水印颜色（CSS 颜色值） */
  fontColor?: string;
  /** 文字水印字体族 */
  fontFamily?: string;
  /** 水印间距 [水平, 垂直]（px） */
  gap?: WatermarkGap;
  /** 水印偏移量 [水平, 垂直]（px），用于微调起始位置 */
  offset?: WatermarkOffset;
  /** 水印层级 */
  zIndex?: number;
  /** 是否开启 MutationObserver 防篡改监听 */
  antiTamper?: boolean;
}
