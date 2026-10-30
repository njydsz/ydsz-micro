/**
 * 公共组件统一出口 — 聚合全部基础 UI 组件与第三方适配层
 *
 * 集中导出表单、表格、弹窗、验证码、骨架屏、水印等复用组件，
 * 并补充 ydsz-ui 适配导出，供业务侧单点引用。
 *
 * @path comm\effects\common-ui\src\components\index.ts
 * @author ydsz-team
 * @since 1.0.0
 *
 * @deprecated
 * 本包正逐步淘汰。请按以下路径迁移：
 * - YdEmptyState、YdErrorState  → 从 `@ydsz/shared-business` 直接导入
 * - form-controls / form-ui 系列 → 从 `@ydsz-core/form-ui` 直接导入
 * - popup-ui 系列              → 从 `@ydsz-core/popup-ui` 直接导入
 * - ydsz-ui 基础组件            → 从 `@ydsz-core/ydsz-ui` 直接导入
 * - 其余 UI 组件（验证码、水印等）→ 视情况迁移到 `@ydsz-core/*` 或各子应用内部
 */

export * from './api-component';
export * from './captcha';
export * from './col-page';
export * from './count-to';
export * from './ellipsis-text';
// YdEmptyState 与 YdErrorState 已移除，迁移至 @ydsz/shared-business
// @see comm/effects/shared-business/src/index.ts
export { default as YdErrorBoundary } from './YdErrorBoundary.vue';
export { default as YdErrorFeedback } from './YdErrorFeedback.vue';

/**
 * @deprecated 从 `@ydsz/common-ui/form-controls` 迁移到 `@ydsz-core/form-ui`。
 * 适配层控件本身暂保留在 common-ui，但应逐步替换为直接依赖 form-ui 的原子件。
 */
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
export * from './virtual-list';
export * from './watermark';

/**
 * @deprecated 直接从 `@ydsz-core/form-ui` 导入。
 */
export * from '@ydsz-core/form-ui';

/**
 * @deprecated 直接从 `@ydsz-core/popup-ui` 导入。
 */
export * from '@ydsz-core/popup-ui';

// 给文档用
/**
 * @deprecated 直接从 `@ydsz-core/ydsz-ui` 导入。
 */
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
} from '@ydsz-core/ydsz-ui';

/**
 * @deprecated 直接从 `@ydsz-core/ydsz-ui` 导入。
 */
export type { FlattenedItem } from '@ydsz-core/ydsz-ui';

/**
 * @deprecated 直接从 `@ydsz-core/ydsz-ui` 导入 `globalShareState`。
 */
export { globalShareState } from '@ydsz-core/shared/global-state';
