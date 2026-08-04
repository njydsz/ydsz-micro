/**
 * index 模块
 *
 * @path comm\effects\common-ui\src\components\index.ts
 * @author remi-team
 * @since 1.0.0
 */
export * from './api-component';
export * from './captcha';
export * from './col-page';
export * from './count-to';
export * from './ellipsis-text';
export * from './empty-state';
export * from './error-boundary';
export * from './error-feedback';
export * from './error-state';
export * from './icon-picker';
export * from './json-viewer';
export * from './loading';
export * from './network-status';
export * from './page';
export * from './page-status';
export * from './resize';
export * from './safe-html';
export * from './tippy';
export * from './watermark';
export * from '@remi-core/form-ui';
export * from '@remi-core/popup-ui';

// 给文档用
export {
  REMIAvatar,
  REMIButton,
  REMIButtonGroup,
  REMICheckbox,
  REMICheckButtonGroup,
  REMICountToAnimator,
  REMIFullScreen,
  REMIInputPassword,
  REMILoading,
  REMILogo,
  REMIPinInput,
  REMISelect,
  REMISpinner,
  REMITree,
} from '@remi-core/shadcn-ui';

export type { FlattenedItem } from '@remi-core/shadcn-ui';
export { globalShareState } from '@remi-core/shared/global-state';
