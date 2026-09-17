/**
 * 子路径入口：@ydsz-core/ui/popup
 *
 * 弹窗族 — YdModal（模态框）、YdDrawer（抽屉）、YdAlert（命令式提示）。
 *
 * @module @ydsz-core/ui/popup
 */
export { YdModal, YdDrawer, YdAlert } from '@ydsz-core/popup-ui';
export {
  useYdModal,
  useYdDrawer,
  setDefaultYdModalProps,
  setDefaultYdDrawerProps,
} from '@ydsz-core/popup-ui';
export type {
  YdPopupApi,
  YdPopupApiCallbacks,
  YdPopupApiOptions,
  YdAlertProps,
  YdPromptProps,
  BeforeCloseScope,
  IconType,
} from '@ydsz-core/popup-ui';
