/**
 * useToast combinable —— 全局 Toast 消息队列管理。
 *
 * 设计目标：
 *  - 提供响应式的 Toast 消息列表；
 *  - 程序化 add / success / info / warning / error / remove / removeGroup / removeAll；
 *  - 全局唯一实例（跨组件共享状态），通过 module 级 reactive store 实现。
 *
 * 与 useNotificationHub 的区别：
 *  - useNotificationHub 是「通知中心」SSE/偏好驱动，强调持久化与未读计数；
 *  - useToast 是轻量的即时讯息提示，强调多位置堆叠与自动消失。
 *
 * 用法：
 * ```vue
 * <script setup lang="ts">
 * import { useToast, YdToastContainer, YdToast } from '@ydsz-core/ydsz-ui/toast';
 *
 * const toast = useToast();
 * toast.success('操作成功');
 * toast.error('操作失败', { life: 5000 });
 * </script>
 *
 * <template>
 *   <YdToastContainer :messages="toast.messages.value">
 *     <template #default="{ message }">
 *       <YdToast
 *         v-bind="message"
 *       />
 *     </template>
 *   </YdToastContainer>
 * </template>
 * ```
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\toast\use-toast.ts
 * @author ydsz-team
 * @since 26.10.11
 */

import type { ComputedRef } from 'vue';

import { computed, ref } from 'vue';

import type {
  ToastHandle,
  ToastMessage,
  ToastOptions,
  ToastPosition,
  ToastSeverity,
  UseToastReturn,
} from './types';

/* ============================================================ */
/* 全局单例 store                                                  */
/* ============================================================ */

/** 全局 Toast 消息列表 —— 全部调用方共享 */
const _messages = ref<ToastMessage[]>([]);

/** 全局消息列表的只读引用（供模板绑定） */
const messages: ComputedRef<ToastMessage[]> = computed(() => _messages.value);

/** 自增 ID 后缀发生器 */
let _idCounter = 0;

/** 生成唯一 ID */
function generateId(): string {
  _idCounter += 1;
  return `ydsz-toast-${Date.now()}-${_idCounter}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

/* ============================================================ */
/* 默认配置                                                        */
/* ============================================================ */

/** 默认持续时长（毫秒） */
const DEFAULT_LIFE = 4500;

/** 默认位置 */
const DEFAULT_POSITION: ToastPosition = 'top-right';

/* ============================================================ */
/* 内部操作                                                        */
/* ============================================================ */

/**
 * 构建一条完整的 ToastMessage（补全默认值）。
 */
function buildMessage(options: ToastOptions): ToastMessage {
  return {
    closable: options.closable ?? true,
    createdAt: Date.now(),
    detail: options.detail,
    group: options.group,
    icon: options.icon,
    id: generateId(),
    life: options.life ?? DEFAULT_LIFE,
    position: options.position ?? DEFAULT_POSITION,
    severity: options.severity ?? 'info',
    summary: options.summary,
  };
}

/**
 * 将新消息接入全局列表顶部（最新在上）。
 */
function pushMessage(message: ToastMessage): void {
  _messages.value = [message, ..._messages.value];
}

/**
 * 按 id 移除一条消息。
 */
function removeById(id: string): void {
  _messages.value = _messages.value.filter((m) => m.id !== id);
}

/**
 * 按位置移除一组消息。
 */
function removeByPosition(position: ToastPosition): void {
  _messages.value = _messages.value.filter((m) => m.position !== position);
}

/** 清空所有消息 */
function clearAll(): void {
  _messages.value = [];
}

/* ============================================================ */
/* 公开 API                                                       */
/* ============================================================ */

/**
 * 添加一条 Toast 通知。
 *
 * @param options - 配置项
 * @returns 操作句柄
 */
function addToast(options: ToastOptions): ToastHandle {
  const message = buildMessage(options);
  pushMessage(message);
  return {
    close: () => removeById(message.id),
  };
}

/**
 * 添加成功级别的快捷方法。
 *
 * @param message - 提示内容
 * @param options - 其他配置项（不覆盖 severity）
 * @returns 操作句柄
 */
function successToast(message: string, options?: Partial<ToastOptions>): ToastHandle {
  return addToast({ ...options, detail: message, severity: 'success' });
}

/**
 * 添加信息级别的快捷方法。
 *
 * @param message - 提示内容
 * @param options - 其他配置项
 * @returns 操作句柄
 */
function infoToast(message: string, options?: Partial<ToastOptions>): ToastHandle {
  return addToast({ ...options, detail: message, severity: 'info' });
}

/**
 * 添加警告级别的快捷方法。
 *
 * @param message - 提示内容
 * @param options - 其他配置项
 * @returns 操作句柄
 */
function warningToast(message: string, options?: Partial<ToastOptions>): ToastHandle {
  return addToast({ ...options, detail: message, severity: 'warning' });
}

/**
 * 添加错误级别的快捷方法。
 *
 * @param message - 提示内容
 * @param options - 其他配置项
 * @returns 操作句柄
 */
function errorToast(message: string, options?: Partial<ToastOptions>): ToastHandle {
  return addToast({ ...options, detail: message, severity: 'error' });
}

/* ============================================================ */
/* 主 Composable                                                  */
/* ============================================================ */

/**
 * useToast —— Toast 通知控制器。
 *
 * @returns UseToastReturn 句柄
 *
 * @example
 * ```typescript
 * const toast = useToast();
 * toast.success('操作成功');
 * toast.error('操作失败，请重试', { life: 5000 });
 * toast.add({
 *   severity: 'info',
 *   summary: '提示',
 *   detail: '这是一条详情',
 *   position: 'bottom-right'
 * });
 * // 移除指定 id
 * const handle = toast.warning('注意');
 * handle.close();
 * ```
 */
export function useToast(): UseToastReturn {
  return {
    add: addToast,
    error: errorToast,
    info: infoToast,
    remove: removeById,
    removeAll: clearAll,
    removeGroup: removeByPosition,
    success: successToast,
    warning: warningToast,
  };
}

/* ============================================================ */
/* 导出全局状态供 YdToastContainer 消费                              */
/* ============================================================ */

export { messages };

export type {
  ToastMessage,
  ToastOptions,
  ToastPosition,
  ToastSeverity,
};
