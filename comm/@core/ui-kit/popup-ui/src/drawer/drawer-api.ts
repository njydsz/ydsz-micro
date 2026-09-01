/**
 * 抽屉的命令式状态管理：在通用弹窗基类之上补一份抽屉默认状态。
 *
 * 默认关闭 openAutoFocus：抽屉常承载表单，自动聚焦到第一个控件会打断阅读；
 * 默认开启 modal 与点击遮罩关闭，符合「抽屉是临时层」的惯常预期。
 *
 * @path comm\@core\ui-kit\popup-ui\src\drawer\drawer-api.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { DrawerApiOptions, DrawerState } from './drawer';

import { PopupApi } from '../popup-api';

const DEFAULT_DRAWER_STATE: DrawerState = {
  class: '',
  closable: true,
  closeIconPlacement: 'right',
  closeOnClickModal: true,
  closeOnPressEscape: true,
  confirmLoading: false,
  contentClass: '',
  footer: true,
  header: true,
  isOpen: false,
  loading: false,
  modal: true,
  openAutoFocus: false,
  placement: 'right',
  showCancelButton: true,
  showConfirmButton: true,
  submitting: false,
  title: '',
};

/**
 * 抽屉 API
 * @description 继承 PopupApi 基类，提供抽屉特有的状态管理
 */
export class DrawerApi extends PopupApi<DrawerState> {
  constructor(options: DrawerApiOptions = {}) {
    super(options, DEFAULT_DRAWER_STATE, 'connectedComponent');
  }
}
