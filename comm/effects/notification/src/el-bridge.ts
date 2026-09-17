/**
 * Element Plus 命令式 API 的语义兼容层 —— EP 退场专用过渡模块。
 *
 * <p>导出与 `element-plus` 同名的 `ElMessage` / `ElMessageBox` / `ElNotification` 对象，
 * 方法签名与返回值契约与 EP 对齐，底层已切换为 ydsz-ui + popup-ui 实现。
 *
 * <p>业务侧将原 `from 'element-plus'` 替换为 `from '@ydsz/notification/compat'`，
 * 逻辑代码可零改动完成迁移。待 EP 全量退出后此模块将随最后一批清理删除。
 *
 * <p>语义对齐要点：
 * <ul>
 *   <li>ElMessageBox —— 取消/关闭时仍 resolve 带 action 的结果对象，
 *       避免破坏原有 try/catch 交互结构</li>
 *   <li>ElMessage —— 字符串 + options 对象两种调用形式，对齐 success/error/warning/info 快捷方式</li>
 *   <li>ElNotification —— 单对象 options 形式，字段名与 EP 一致</li>
 * </ul>
 *
 * @path comm/effects/notification/src/el-bridge.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { Component } from 'vue';

import type { IconType } from '@ydsz-core/popup-ui';
import { alert, confirm, prompt } from '@ydsz-core/popup-ui';
import { useSimpleLocale } from '@ydsz-core/composables';

import { showToast } from './use-toast';

const { $t } = useSimpleLocale();

// =====================================================================
// 类型契约
// =====================================================================

/** ElMessage 支持的消息等级 */
type MessageType = 'error' | 'info' | 'success' | 'warning';

/** ElMessage string 形式参数 */
type MessageArg = string | MessageOptions;

/** ElMessage options 对象 */
interface MessageOptions {
  closeable?: boolean;
  duration?: number;
  message?: string;
  showClose?: boolean;
  type?: MessageType;
}

/** ElMessageBox 返回值 */
interface MessageBoxReturnValue {
  action: 'cancel' | 'close' | 'confirm';
  value: string;
}

/** ElMessageBox.confirm / alert 的 options */
interface ConfirmOptions {
  cancelButtonText?: string;
  confirmButtonText?: string;
  distinguishCancelAndClose?: boolean;
  inputPattern?: RegExp;
  inputType?: string;
  message?: string | Component;
  title?: string;
  type?: IconType;
}

/** ElMessageBox.prompt 的 options */
interface PromptOptions extends ConfirmOptions {
  inputErrorMessage?: string;
  inputPlaceholder?: string;
  inputValue?: string;
  showInput?: boolean;
}

/** ElNotification options */
interface NotificationOptions {
  duration?: number;
  message?: string;
  title?: string;
  type?: MessageType;
}

// =====================================================================
// ElMessage 对象
// =====================================================================

/** 内部：把 type 映射为 showToast variant */
function mapTypeToVariant(type?: MessageType): 'default' | 'info' | 'success' | 'warning' | 'error' {
  switch (type) {
    case 'error':
      return 'error';
    case 'success':
      return 'success';
    case 'warning':
      return 'warning';
    default:
      return 'default';
  }
}

/** 内部：根据 type + duration 生成 toast duration */
function mapTypeToDuration(type?: MessageType, customDuration?: number): number {
  if (customDuration !== undefined) {
    return customDuration;
  }
  return type === 'error' ? 6000 : type === 'warning' ? 3500 : 4000;
}

const elMessage = {
  /**
   * 默认调用形式。
   *
   * @param arg —— 字符串或 options 对象
   */
  default(arg: MessageArg): void {
    if (typeof arg === 'string') {
      showToast(arg, { variant: 'default' });
      return;
    }
    showToast(arg.message ?? '', {
      variant: mapTypeToVariant(arg.type),
      duration: mapTypeToDuration(arg.type, arg.duration),
    });
  },

  /**
   * 成功提示。
   *
   * @param msg —— 提示文案
   */
  success(msg: string): void {
    showToast.success(msg);
  },

  /**
   * 错误提示。
   *
   * @param msg —— 提示文案
   */
  error(msg: string): void {
    showToast.error(msg);
  },

  /**
   * 警告提示。
   *
   * @param msg —— 提示文案
   */
  warning(msg: string): void {
    showToast.warning(msg);
  },

  /**
   * 信息提示。
   *
   * @param msg —— 提示文案
   */
  info(msg: string): void {
    showToast.info(msg);
  },
};

// =====================================================================
// ElMessageBox 对象
// =====================================================================

const elMessageBox = {
  /**
   * 确认对话框。
   *
   * @param msg —— 确认正文（options.message 优先）
   * @param title —— 弹窗标题
   * @param options —— 完整配置
   */
  confirm(
    msg: string,
    title?: string,
    options?: ConfirmOptions,
  ): Promise<MessageBoxReturnValue> {
    return new Promise((resolve) => {
      void confirm(
        (typeof options?.message === 'string' ? options.message : msg) || msg,
        title ?? $t.value('prompt'),
        {
          confirmText: options?.confirmButtonText,
          cancelText: options?.cancelButtonText,
          icon: options?.type ?? 'question',
          showCancel: true,
        },
      )
        .then(() => {
          resolve({ action: 'confirm', value: '' });
        })
        .catch(() => {
          resolve({ action: 'cancel', value: '' });
        });
    });
  },

  /**
   * 提示对话框（无取消按钮）。
   *
   * @param msg —— 提示正文
   * @param title —— 弹窗标题
   * @param options —— 完整配置
   */
  alert(
    msg: string,
    title?: string,
    options?: ConfirmOptions,
  ): Promise<MessageBoxReturnValue> {
    return new Promise((resolve) => {
      void alert(
        (typeof options?.message === 'string' ? options.message : msg) || msg,
        title ?? $t.value('prompt'),
        {
          confirmText: options?.confirmButtonText,
          icon: options?.type ?? 'info',
          showCancel: false,
        },
      )
        .then(() => {
          resolve({ action: 'confirm', value: '' });
        })
        .catch(() => {
          resolve({ action: 'cancel', value: '' });
        });
    });
  },

  /**
   * 输入对话框。
   *
   * @param msg —— 提示正文
   * @param title —— 弹窗标题
   * @param options —— 输入框配置
   */
  prompt(
    msg: string,
    title?: string,
    options?: PromptOptions,
  ): Promise<MessageBoxReturnValue> {
    return new Promise((resolve) => {
      void prompt<string>({
        content: (typeof options?.message === 'string' ? options.message : msg) || msg,
        defaultValue: options?.inputValue ?? '',
        confirmText: options?.confirmButtonText,
        cancelText: options?.cancelButtonText,
        title: title ?? $t.value('prompt'),
        componentProps: {
          placeholder: options?.inputPlaceholder,
        },
      })
        .then((val) => {
          resolve({ action: 'confirm', value: String(val ?? '') });
        })
        .catch(() => {
          resolve({ action: 'cancel', value: '' });
        });
    });
  },
};

// =====================================================================
// ElNotification 对象
// =====================================================================

const elNotification = {
  /**
   * 桌面通知。
   *
   * @param options —— 通知配置
   */
  default(options: NotificationOptions): void {
    showToast(options.title ?? '', {
      description: options.message,
      variant: mapTypeToVariant(options.type),
      duration: options.duration ?? 4500,
    });
  },

  success(options: NotificationOptions): void {
    showToast(options.title ?? '', {
      description: options.message,
      variant: 'success',
      duration: options.duration ?? 4500,
    });
  },

  error(options: NotificationOptions): void {
    showToast(options.title ?? '', {
      description: options.message,
      variant: 'error',
      duration: options.duration ?? 6000,
    });
  },

  warning(options: NotificationOptions): void {
    showToast(options.title ?? '', {
      description: options.message,
      variant: 'warning',
      duration: options.duration ?? 4500,
    });
  },

  info(options: NotificationOptions): void {
    showToast(options.title ?? '', {
      description: options.message,
      variant: 'default',
      duration: options.duration ?? 4500,
    });
  },
};

// =====================================================================
// 导出
// =====================================================================

export const ElMessage = elMessage;
export const ElMessageBox = elMessageBox;
export const ElNotification = elNotification;

export type {
  ConfirmOptions,
  MessageArg,
  MessageOptions,
  MessageType,
  MessageBoxReturnValue,
  NotificationOptions,
  PromptOptions,
};
