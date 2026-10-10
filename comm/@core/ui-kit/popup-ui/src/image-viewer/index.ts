/**
 * ImageViewer 图片预览组件入口。
 *
 * <p>提供命令式 API：通过 useImageViewer() 获取预览器实例，
 * YdImageViewer 组件挂载于 App 根节点负责渲染。
 *
 * <p>典型用法：
 * <pre>
 *   // main.ts
 *   import { useImageViewer, YdImageViewer } from '@ydsz-core/popup-ui/image-viewer';
 *
 *   const viewer = useImageViewer({ maxScale: 4 });
 *   app.component('YdImageViewer', YdImageViewer);
 *
 *   // 业务组件
 *   viewer.open([{ src: '/a.jpg' }, { src: '/b.jpg' }], 0);
 * </pre>
 *
 * @path comm\@core\ui-kit\popup-ui\src\image-viewer\index.ts
 * @author ydsz-team
 * @since 26.09.24
 */
export { useImageViewer, useImageViewerReadonlyState, useImageViewerState } from './use-image-viewer';
export type {
  ImageViewerApi,
  ImageViewerImage,
  ImageViewerOptions,
  ImageViewerState,
} from './types';

// Vue 组件以 default 导出
export { default as YdImageViewer } from './YdImageViewer.vue';
