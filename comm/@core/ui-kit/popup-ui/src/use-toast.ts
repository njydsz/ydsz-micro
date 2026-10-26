/**
 * 轻量消息提示（toast）的组合式 API：useToast。
 *
 * 对标 PrimeVue 的 useToast 用法，在 setup 上下文中提供组件作用域的 toast 控制器。
 * 内部委托已有的命令式函数（ydszMessage / messageSuccess 等），
 * 并补充「当前实例发出的消息」追踪能力——方便在组件卸载时自动清理自己发出的 toast，
 * 避免组件销毁后 toast 残留造成内存泄漏。
 *
 * 与直接调用 ydzzMessage 的区别：
 * - ydzzMessage 是全局函数，发出的 toast 与调用者生命周期解耦；
 * - useToast 会把发出的 id 登记在内部 Set 中，组件 onUnmounted 时可选清理，
 *   并暴露 `messages` 响应式引用供模板渲染自定义 UI。
 *
 * @path comm\@core\ui-kit\popup-ui\src\use-toast.ts
 * @author ydsz-team
 * @since 26.10.11
 */

import type { ComputedRef, Ref } from 'vue';

import { getCurrentScope, onScopeDispose, ref } from 'vue';

import type { MessageItem, MessageOptions } from './message/message';

import {
  closeAllMessages,
  closeMessage,
  messageError,
  messageInfo,
  messageLoading,
  messageSuccess,
  messageWarning,
  sortedMessages,
} from './message/message';

/** useToast 返回的控制器句柄 */
export interface UseToastReturn {
  /**
   * 全部消息的响应式列表（按类型优先级排序）。
   *
   * 直接来自全局 messageList，包含所有调用方弹出的消息；
   * 不局限于当前实例所发。如需仅当前实例的消息，用 {@link ownMessageIds} 过滤。
   */
  messages: ComputedRef<MessageItem[]>;
  /**
   * 当前实例已发出且尚未离开的消息 id 集合。
   *
   * 作用域销毁（组件卸载 / effect scope 结束）时自动清空这些 toast。
   */
  ownMessageIds: Ref<Set<string>>;
  /** 弹出一条消息；参数形态与 ydzzMessage 完全一致 */
  add(options: MessageOptions): string;
  /** 以字符串入参弹出消息 */
  add(content: string, options?: Omit<MessageOptions, 'content'>): string;
  /** 弹出成功消息 */
  success(content: string, options?: Omit<MessageOptions, 'content' | 'type'>): string;
  /** 弹出信息消息 */
  info(content: string, options?: Omit<MessageOptions, 'content' | 'type'>): string;
  /** 弹出警告消息 */
  warning(content: string, options?: Omit<MessageOptions, 'content' | 'type'>): string;
  /** 弹出错误消息 */
  error(content: string, options?: Omit<MessageOptions, 'content' | 'type'>): string;
  /** 弹出 loading 常驻消息（duration 强制为 0） */
  loading(content: string, options?: Omit<MessageOptions, 'content' | 'type' | 'duration'>): string;
  /** 关闭指定 id 的消息 */
  close(id: string): void;
  /** 关闭当前实例发出的全部消息 */
  closeOwn(): void;
  /** 关闭所有消息（含其他实例发出的） */
  clear(): void;
}

/**
 * 创建组件作用域的 toast 控制器。
 *
 * @returns UseToastRight 控制器
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const toast = useToast();
 *
 * function handleSave() {
 *   toast.success('保存成功');
 * }
 *
 * async function handleSubmit() {
 *   const id = toast.loading('提交中...');
 *   await api.submit();
 *   toast.close(id);
 *   toast.success('提交成功');
 * }
 * </script>
 * ```
 */
export function useToast(): UseToastReturn {
  const ownMessageIds = ref<Set<string>>(new Set());

  /**
   * 登记一条由当前实例发出的消息 id。
   */
  function track(id: string): void {
    ownMessageIds.value.add(id);
  }

  /**
   * 按类型分发到对应的 messageXxx 便捷函数。
   */
  function addMessage(options: MessageOptions): string {
    const { content, type, ...rest } = options;
    const sender = type === 'error' ? messageError
      : type === 'warning' ? messageWarning
      : type === 'loading' ? messageLoading
      : type === 'success' ? messageSuccess
      : type === 'info' ? messageInfo
      : messageInfo;
    return sender(content, rest);
  }

  function addToast(optionsOrContent: MessageOptions | string, maybeOptions?: Omit<MessageOptions, 'content'>): string {
    let id: string;
    if (typeof optionsOrContent === 'object' && 'content' in optionsOrContent) {
      id = addMessage(optionsOrContent);
    } else {
      id = addMessage({ content: optionsOrContent as string, ...maybeOptions });
    }
    track(id);
    return id;
  }

  function closeToast(id: string): void {
    closeMessage(id);
    ownMessageIds.value.delete(id);
  }

  function closeOwnToasts(): void {
    ownMessageIds.value.forEach((id) => closeMessage(id));
    ownMessageIds.value.clear();
  }

  /**
   * 作用域销毁时自动清理自己发出的 toast。
   *
   * 使用 onScopeDispose 而非 onUnmounted：既适配组件卸载，
   * 也适配手动 effect scope（如 Composable 内部创建的临时 scope）。
   * getCurrentScope 在 <script setup> 内恒返回组件 effect scope，不会为 null。
   */
  if (getCurrentScope()) {
    onScopeDispose(() => {
      closeOwnToasts();
    });
  }

  return {
    messages: sortedMessages,
    ownMessageIds,
    add: addToast,
    success: (content, options) => addToast({ content, type: 'success', ...options }),
    info: (content, options) => addToast({ content, type: 'info', ...options }),
    warning: (content, options) => addToast({ content, type: 'warning', ...options }),
    error: (content, options) => addToast({ content, type: 'error', ...options }),
    loading: (content, options) => addToast({ content, type: 'loading', duration: 0, ...options }),
    close: closeToast,
    closeOwn: closeOwnToasts,
    clear: closeAllMessages,
  };
}

// 保持单一 default export，便于 auto-import 友好
export { useToast as default };
