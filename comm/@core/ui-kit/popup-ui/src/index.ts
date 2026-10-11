/**
 * popup-ui 的包出口：提示弹窗、抽屉、弹窗三个子模块，以及通用弹窗基类与嵌套管理器。
 *
 * @path comm\@core\ui-kit\popup-ui\src\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export * from './alert';
export * from './dialog';
export * from './drawer';
export * from './image-viewer';
export * from './message';
export * from './modal';
// PrimeVue 风格的命令式 composables（对标 useToast / useConfirm）
export { useToast } from './use-toast';
export type { UseToastReturn } from './use-toast';
export { useConfirm } from './use-confirm';
export type { ConfirmOptions, UseConfirmReturn } from './use-confirm';
export { usePrompt } from './use-prompt';
export type { PromptOptions, UsePromptReturn } from './use-prompt';
export {
  closeTopOverlay,
  getOverlayDepth,
  getTopOverlay,
  nextOverlayId,
  registerOverlay,
} from './overlay-manager';
export type { OverlayEntry } from './overlay-manager';
export type { YdPopupApi, YdPopupApiCallbacks, YdPopupApiOptions } from './popup-api';
