/**
 * 弹窗的命令式状态管理：在通用弹窗基类之上补一份弹窗默认状态。
 *
 * 默认 destroyOnClose 为 true 而抽屉为 false：
 * 弹窗常承载需要重置的表单，销毁更省事；抽屉中的内容（如滚动位置、展开的节点）
 * 往往希望保留，故默认不销毁。
 *
 * @path comm\@core\ui-kit\popup-ui\src\modal\modal-api.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { ModalApiOptions, ModalState } from './modal';

import { PopupApi } from '../popup-api';

const DEFAULT_MODAL_STATE: ModalState = {
  bordered: true,
  centered: false,
  class: '',
  closeOnClickModal: true,
  closeOnPressEscape: true,
  confirmDisabled: false,
  confirmLoading: false,
  contentClass: '',
  destroyOnClose: true,
  draggable: false,
  footer: true,
  footerClass: '',
  fullscreen: false,
  fullscreenButton: true,
  header: true,
  headerClass: '',
  isOpen: false,
  loading: false,
  modal: true,
  openAutoFocus: false,
  showCancelButton: true,
  showConfirmButton: true,
  title: '',
  animationType: 'slide',
};

/**
 * 弹窗 API
 * @description 继承 PopupApi 基类，提供弹窗特有的状态管理
 */
export class ModalApi extends PopupApi<ModalState> {
  constructor(options: ModalApiOptions = {}) {
    super(options, DEFAULT_MODAL_STATE, 'connectedComponent');
  }
}
