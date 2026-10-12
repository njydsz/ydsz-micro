/**
 * QrCode 组件的 props 类型与 emits 定义。
 *
 * @author ydsz-ai
 * @since 1.0.0
 */

import type { QRLevel } from './qr-code-utils';

/**
 * QrCode 组件属性。
 */
export interface QRCodeProps {
  /** 自定义 CSS class */
  class?: string;
  /** 二维码编码文本内容 */
  value?: string;
  /** 画布尺寸（像素，正方形），默认 160 */
  size?: number;
  /** 纠错级别（L/M/Q/H），级别越高矩阵越大，默认 'M' */
  level?: QRLevel;
  /** 前景色（模块颜色），默认 '#000000' */
  color?: string;
  /** 背景色，默认 '#ffffff' */
  bgColor?: string;
  /** 静默区（边距像素数），默认 2 */
  margin?: number;
}

/**
 * QrCode 组件事件。
 */
export interface QRCodeEmits {
  /** 二维码绘制完成回调 */
  (e: 'rendered'): void;
}
