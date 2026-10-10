/**
 * 对话框的命令式状态管理：在 ModalApi 基础上补一份弹窗语义化默认值。
 *
 * 与 ModalApi 的差异：
 *  - closeOnClickModal 默认 false（避免误关，对话框需显式确认）；
 *  - closable 默认 true、header 默认 true、centered 默认 true；
 *  - footer 默认 true，showConfirmButton / showCancelButton 默认均 true；
 *  - 不提供 fullscreen / draggable / fullscreenButton，对话框聚焦确认/取消流程。
 *
 * @path comm\@core\ui-kit\popup-ui\src\dialog\dialog-api.ts
 * @author ydsz-team
 * @since 26.09.24
 */

import type { ModalApiOptions, ModalState } from '../modal/modal';

import { ModalApi } from '../modal/modal-api';

/** DialogApi 默认状态——比 ModalApi 更克制，聚焦确认交互 */
const DEFAULT_DIALOG_STATE: ModalState = {
  bordered: true,
  centered: true,
  class: '',
  closeOnClickModal: false,
  closeOnPressEscape: true,
  confirmDisabled: false,
  confirmLoading: false,
  contentClass: '',
  destroyOnClose: true,
  draggable: false,
  footer: true,
  footerClass: '',
  fullscreen: false,
  fullscreenButton: false,
  header: true,
  headerClass: '',
  isOpen: false,
  loading: false,
  modal: true,
  openAutoFocus: false,
  showCancelButton: true,
  showConfirmButton: true,
  title: '',
  animationType: 'scale',
};

/**
 * 对话框命令式 API，继承 ModalApi 基类并盖上对话框语义默认值。
 */
export class DialogApi extends ModalApi {
  constructor(options: ModalApiOptions = {}) {
    super(options, DEFAULT_DIALOG_STATE, 'connectedComponent');
  }
}

/**
 * 创建对话框 API 实例的工厂函数。
 *
 * @param options - 对话框初始化选项（见 ModalApiOptions）
 * @returns DialogApi 实例
 *
 * @example
 * ```ts
 * const dialog = createDialog({ onConfirm: () => handleConfirm() });
 * dialog.open();
 * ```
 */
export function createDialog(options: ModalApiOptions = {}): DialogApi {
  return new DialogApi(options);
}
