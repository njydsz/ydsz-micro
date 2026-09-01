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
export * from './empty-state.vue';
export * from './error-boundary.vue';
export * from './error-feedback.vue';
export * from './error-state.vue';
export * from './icon-picker';
export * from './json-viewer';
export * from './loading';
export * from './network-status.vue';
export * from './page';
export * from './page-status';
export * from './resize';
export * from './safe-html';
export * from './skeleton';
export * from './tippy';
export * from './watermark';
export * from '@YDSZ-core/form-ui';
export * from '@YDSZ-core/popup-ui';

// 给文档用
export {
  YDSZAvatar,
  YDSZButton,
  YDSZButtonGroup,
  YDSZCheckbox,
  YDSZCheckButtonGroup,
  YDSZCountToAnimator,
  YDSZFullScreen,
  YDSZInputPassword,
  YDSZLoading,
  YDSZLogo,
  YDSZPinInput,
  YDSZSelect,
  YDSZSpinner,
  YDSZTree,
} from '@YDSZ-core/shadcn-ui';

export type { FlattenedItem } from '@YDSZ-core/shadcn-ui';
export { globalShareState } from '@YDSZ-core/shared/global-state';
