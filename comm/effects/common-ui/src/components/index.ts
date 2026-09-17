/**
 * 公共组件统一出口 — 聚合全部基础 UI 组件与第三方适配层
 *
 * 集中导出表单、表格、弹窗、验证码、骨架屏、水印等复用组件，
 * 并补充 shadcn-ui 适配导出，供业务侧单点引用。
 *
 * @path comm\effects\common-ui\src\components\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export * from './api-component';
export * from './captcha';
export * from './col-page';
export * from './count-to';
export * from './ellipsis-text';
export { default as YdEmptyState } from './YdCommonEmptyState.vue';
export { default as YdErrorBoundary } from './YdErrorBoundary.vue';
export { default as YdErrorFeedback } from './YdErrorFeedback.vue';
export { default as YdErrorState } from './YdErrorState.vue';
export * from './form-controls';
export * from './icon-picker';
export * from './json-viewer';
export * from './loading';
export { default as YdNetworkStatus } from './YdNetworkStatus.vue';
export * from './page';
export * from './page-status';
export * from './resize';
export * from './safe-html';
export * from './skeleton';
export * from './tippy';
export * from './watermark';
export * from '@ydsz-core/form-ui';
export * from '@ydsz-core/popup-ui';

// 给文档用
export {
  YdAvatar,
  YdButton,
  YdButtonGroup,
  YdCheckbox,
  YdCheckButtonGroup,
  YdCountToAnimator,
  YdFullScreen,
  YdInputPassword,
  YdLoading,
  YdLogo,
  YdPinInput,
  YdSelect,
  YdSpinner,
  YdTree,
} from '@ydsz-core/shadcn-ui';

export type { FlattenedItem } from '@ydsz-core/shadcn-ui';
export { globalShareState } from '@ydsz-core/shared/global-state';
