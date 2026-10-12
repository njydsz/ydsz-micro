/**
 * 确认对话框组件 barrel —— 集中导出 ConfirmDialog / ConfirmPopup 组件、useConfirm composable 及相关类型。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\confirm-dialog\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */

export { default as YdConfirmDialog } from './YdConfirmDialog.vue';
export { default as YdConfirmPopup } from './YdConfirmPopup.vue';
export { useConfirm } from './use-confirm';

export type {
  ConfirmButtonType,
  ConfirmDialogEmits,
  ConfirmDialogProps,
  ConfirmOptions,
  ConfirmPopupEmits,
  ConfirmPopupProps,
  ConfirmPt,
  RejectButtonType,
  UseConfirmReturn,
} from './types';
