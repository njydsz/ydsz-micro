/**
 * ImageEditor 图片裁剪编辑组件类型定义。
 *
 * 提供基于 Canvas 的图片裁剪功能，支持拖拽裁剪框、
 * 四角 resize 手柄、宽高比约束与裁剪结果预览。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\image-editor\image-editor-types.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** 裁剪区域矩形 */
export interface ImageEditorRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 宽高比约束 */
export type ImageEditorAspectRatio = 'free' | '1:1' | '4:3' | '16:9';

/** ImageEditor 组件 Props */
export interface ImageEditorProps {
  class?: string;
  /** 图片源 URL */
  src?: string;
  /** 裁剪区域默认值 */
  defaultCrop?: ImageEditorRect;
  /** 宽高比约束 */
  aspectRatio?: ImageEditorAspectRatio;
  /** 是否显示预览 */
  showPreview?: boolean;
  /** 预览区尺寸 */
  previewSize?: number;
  /** 最小裁剪尺寸 */
  minCropSize?: number;
}

/** ImageEditor 组件 Emits */
export interface ImageEditorEmits {
  (e: 'crop', rect: ImageEditorRect): void;
  (e: 'cancel'): void;
}

/** ImageEditor 组件暴露方法 */
export interface ImageEditorExpose {
  getCropRect: () => ImageEditorRect | null;
  applyCrop: () => Promise<string>;
  reset: () => void;
}
