/**
 * 命令式消息确认框。
 *
 * 对齐 Element Plus ElMessageBox 的 API，提供 confirm / alert / prompt 方法，
 * 在任意 JS/TS 上下文中以 Promise 方式调用确认弹窗。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-message-box.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { App } from 'vue';

/* ============================================================ */
/* 类型定义                                                       */
/* ============================================================ */

/** 消息框类型 */
export type MessageBoxType = 'info' | 'success' | 'warning' | 'error';

/** 消息框回调动作 */
export type MessageBoxAction = 'confirm' | 'cancel' | 'close';

/** confirm 配置 */
export interface MessageBoxConfirmOptions {
  /** 标题 */
  title?: string;
  /** 内容 */
  content?: string;
  /** 消息框类型 */
  type?: MessageBoxType;
  /** 确认按钮文本 */
  confirmButtonText?: string;
  /** 取消按钮文本 */
  cancelButtonText?: string;
  /** 是否在点击遮罩层后关闭 */
  closeOnClickModal?: boolean;
  /** 是否在按下 ESC 后关闭 */
  closeOnPressEscape?: boolean;
  /** 是否显示取消按钮 */
  showCancelButton?: boolean;
  /** 是否显示关闭按钮 */
  showClose?: boolean;
  /** 是否在关闭前拦截（返回 false 或 Promise<false> 可阻止关闭） */
  beforeClose?: (action: MessageBoxAction, instance: { visible: boolean }) => boolean | Promise<boolean>;
  /** 自定义类名 */
  customClass?: string;
}

/** alert 配置（单按钮，无取消） */
export type MessageBoxAlertOptions = Omit<MessageBoxConfirmOptions, 'showCancelButton' | 'confirmButtonText'> & {
  confirmButtonText?: string;
};

/** 确认框输入配置 */
export interface MessageBoxPromptOptions extends MessageBoxConfirmOptions {
  /** 输入框类型 */
  inputType?: 'text' | 'textarea' | 'password';
  /** 输入框占位符 */
  inputPlaceholder?: string;
  /** 默认值 */
  inputValue?: string;
  /** 输入验证正则 */
  inputPattern?: RegExp;
  /** 验证失败提示 */
  inputErrorMessage?: string;
}

/** showMessageBox 响应数据 */
export interface MessageBoxResponseData {
  /** 用户的操作 */
  action: MessageBoxAction;
  /** 用户的输入值（仅 prompt 模式） */
  value?: string;
}

/** 消息框 API 接口 */
export interface MessageBoxApi {
  /** 确认框 */
  confirm: (options: MessageBoxConfirmOptions) => Promise<MessageBoxResponseData>;
  /** 警告框（单按钮） */
  alert: (options: MessageBoxAlertOptions) => Promise<MessageBoxResponseData>;
  /** 输入框 */
  prompt: (options: MessageBoxPromptOptions) => Promise<MessageBoxResponseData>;
  /** 关闭所有消息框 */
  closeAll: () => void;
}

/* ============================================================ */
/* 内部状态                                                       */
/* ============================================================ */

/** 模态框引用栈 */
let modalStack: Array<{ app: App; container: HTMLElement }> = [];

/* ============================================================ */
/* 公开 API                                                       */
/* ============================================================ */

/**
 * 命令式消息确认框 API。
 *
 * @example
 * ```ts
 * import { showMessageBox } from '@ydsz-core/ydsz-ui';
 *
 * // 确认框
 * const result = await showMessageBox.confirm({
 *   title: '确认删除',
 *   content: '此操作不可撤销',
 *   type: 'warning',
 * });
 *
 * if (result.action === 'confirm') {
 *   // 执行删除
 * }
 * ```
 */
export const showMessageBox: MessageBoxApi = {
  confirm: (_options: MessageBoxConfirmOptions): Promise<MessageBoxResponseData> => {
    // 推迟导入以避免 bundle 体积膨胀
    return import('./use-message-box-internal').then((mod) => mod.mountMessageBox({
      ..._options,
      showCancelButton: _options.showCancelButton ?? true,
    }));
  },

  alert: (_options: MessageBoxAlertOptions): Promise<MessageBoxResponseData> => {
    return import('./use-message-box-internal').then((mod) => mod.mountMessageBox({
      ..._options,
      showCancelButton: false,
    }));
  },

  prompt: (_options: MessageBoxPromptOptions): Promise<MessageBoxResponseData> => {
    return import('./use-message-box-internal').then((mod) => mod.mountMessageBox({
      ..._options,
      showCancelButton: true,
    }));
  },

  closeAll: (): void => {
    while (modalStack.length > 0) {
      const entry = modalStack.pop();
      if (entry) {
        entry.app.unmount();
        entry.container.remove();
      }
    }
  },
};

