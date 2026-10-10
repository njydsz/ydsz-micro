/**
 * useImageViewer —— 图片预览器的命令式入口。
 *
 * <p>对标 Ant Design Vue Image.PreviewGroup 与 PrimeVue Image 的命令式 API。
 * 通过 OverlayManager 注册叠层，配合渲染于 App 根节点的 YdImageViewer 组件实现全堆栈覆盖。
 *
 * <p>典型用法：
 * <pre>
 *   const imageViewer = useImageViewer();
 *   imageViewer.open([
 *     { src: '/a.jpg', alt: '产品图 A' },
 *     { src: '/b.jpg', alt: '产品图 B' },
 *   ], 0);
 * </pre>
 *
 * @path comm\@core\ui-kit\popup-ui\src\image-viewer\use-image-viewer.ts
 * @author ydsz-team
 * @since 26.09.24
 */
import type {
  ImageViewerApi,
  ImageViewerImage,
  ImageViewerOptions,
  ImageViewerState,
} from './types';

import { reactive, readonly } from 'vue';

import {
  nextOverlayId,
  registerOverlay,
} from '../overlay-manager';

/** 默认配置 */
const DEFAULT_OPTIONS: Required<ImageViewerOptions> = {
  scaleStep: 0.25,
  minScale: 0.5,
  maxScale: 5,
  closeOnEsc: true,
};

/** 模块级单例状态——所有 useImageViewer() 调用共享
 * <p>外部仅可通过 useImageViewerReadonlyState 获取只读视图，
 * 避免非 API 途径意外修改状态。
 */
const sharedState = reactive<ImageViewerState>({
  isOpen: false,
  images: [],
  currentIndex: 0,
  scale: 1,
  rotation: 0,
  offset: { x: 0, y: 0 },
  options: { ...DEFAULT_OPTIONS },
});

/** OverlayManager 注销函数引用（打开期间有效） */
let unregisterOverlay: (() => void) | null = null;

/**
 * 将一个数值夹闭在指定区间内。
 *
 * @param value 原值
 * @param min 下限
 * @param max 上限
 * @returns 夹闭后的值
 *
 * @example
 * ```ts
 * clamp(10, 0, 5); // => 5
 * ```
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** 重置缩放/旋转/位移到初始值 */
function resetTransform(): void {
  sharedState.scale = 1;
  sharedState.rotation = 0;
  sharedState.offset = { x: 0, y: 0 };
}

/**
 * 创建并返回图片预览器的命令式 API。
 *
 * <p>多次调用返回的是同一份 API（模块级单例），适合放置在 App 根部只挂载一次 YdImageViewer。
 *
 * @param options 全局配置覆盖（可选）。传入后会与默认值浅合并。
 * @returns 只读的 {@link ImageViewerApi} 实例
 *
 * @example
 * ```ts
 * const viewer = useImageViewer({ maxScale: 3, closeOnEsc: true });
 * viewer.open(images, 0);
 * ```
 */
export function useImageViewer(
  options?: ImageViewerOptions,
): ImageViewerApi {
  // 合并配置（允许首次或后续调用覆盖）
  if (options) {
    sharedState.options = { ...DEFAULT_OPTIONS, ...options };
  }

  const api: ImageViewerApi = {
    open(images: readonly ImageViewerImage[], initialIndex?: number): void {
      if (images.length === 0) {
        return;
      }
      sharedState.images = [...images];
      sharedState.currentIndex = clamp(
        initialIndex ?? 0,
        0,
        images.length - 1,
      );
      resetTransform();

      // 注册叠层（仅首次打开时注册一次）
      if (!sharedState.isOpen) {
        unregisterOverlay?.();
        unregisterOverlay = registerOverlay({
          id: nextOverlayId(),
          close: () => api.close(),
        });
      }
      sharedState.isOpen = true;
    },

    close(): void {
      if (!sharedState.isOpen) {
        return;
      }
      sharedState.isOpen = false;
      unregisterOverlay?.();
      unregisterOverlay = null;
      resetTransform();
    },

    next(): void {
      if (sharedState.currentIndex < sharedState.images.length - 1) {
        sharedState.currentIndex++;
        resetTransform();
      }
    },

    prev(): void {
      if (sharedState.currentIndex > 0) {
        sharedState.currentIndex--;
        resetTransform();
      }
    },
  };

  return api;
}

/**
 * 获取 ImageViewer 的只读响应式状态（供 YdImageViewer 渲染组件订阅）。
 *
 * <p>该状态是模块级单例，YdImageViewer 直接订阅它来实现数据驱动渲染。
 * 渲染组件必须使用此函数获取状态，确保与命令式 API 操作的是同一份数据。
 * 返回 readonly 视图：渲染组件只应消费状态，不得通过此引用修改状态。
 *
 * @returns 只读响应式状态（仍具响应性，禁止直接修改）
 *
 * @example
 * ```vue
 * <script setup>
 * const viewerState = useImageViewerState();
 * </script>
 * ```
 */
export function useImageViewerState(): Readonly<ImageViewerState> {
  return readonly(sharedState);
}
