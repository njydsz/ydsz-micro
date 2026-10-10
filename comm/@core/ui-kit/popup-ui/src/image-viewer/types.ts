/**
 * ImageViewer 图片预览组件的公开类型契约。
 *
 * <p>定义图片数据、API 接口与配置选项，供 useImageViewer 消费方与 YdImageViewer 渲染组件引用。
 *
 * @path comm\@core\ui-kit\popup-ui\src\image-viewer\types.ts
 * @author ydsz-team
 * @since 26.09.24
 */

/** 单张图片的描述信息 */
export interface ImageViewerImage {
  /** 必填：原图 URL */
  src: string;
  /** 可选：替代文本，用于无障碍 */
  alt?: string;
  /** 可选：缩略图 URL（不传则直接复用 src） */
  thumbnail?: string;
}

/** 图片预览器的配置项 */
export interface ImageViewerOptions {
  /** 鼠标滚轮/按钮缩放的步进值
   * @default 0.25
   */
  scaleStep?: number;
  /** 最小缩放倍率
   * @default 0.5
   */
  minScale?: number;
  /** 最大缩放倍率
   * @default 5
   */
  maxScale?: number;
  /** 是否允许 ESC 键关闭预览
   * @default true
   */
  closeOnEsc?: boolean;
}

/** 图片预览器命令式 API 接口 */
export interface ImageViewerApi {
  /**
   * 打开预览器并展示图片列表。
   *
   * @param images 图片列表
   * @param initialIndex 初始展示的图片索引（从 0 开始；超出范围时取边界）
   */
  open(images: readonly ImageViewerImage[], initialIndex?: number): void;

  /** 关闭预览器 */
  close(): void;

  /** 翻到下一张（已是最后一张时无操作） */
  next(): void;

  /** 翻到上一张（已是第一张时无操作） */
  prev(): void;
}

/** 预览器内部状态（模块级共享单例，驱动 YdImageViewer 渲染） */
export interface ImageViewerState {
  /** 是否处于打开状态 */
  isOpen: boolean;
  /** 图片列表 */
  images: readonly ImageViewerImage[];
  /** 当前激活的图片索引 */
  currentIndex: number;
  /** 当前缩放倍率 */
  scale: number;
  /** 当前旋转角度（度，0 | 90 | 180 | 270） */
  rotation: number;
  /** 拖拽位移 */
  offset: { x: number; y: number };
  /** 配置项 */
  options: Required<ImageViewerOptions>;
}
