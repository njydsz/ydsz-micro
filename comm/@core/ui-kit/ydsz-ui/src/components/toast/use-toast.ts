/**
 * useToast combinable —— 全局 Toast 消息队列管理。
 *
 * 设计目标：
 *  - 提供响应式的 Toast 消息列表；
 *  - 程序化 add / success / info / warning / error / remove / removeGroup / removeByPosition / removeAll；
 *  - 全局唯一实例（跨组件共享状态），通过 module 级 reactive store 实现。
 *
 * 与 useNotificationHub 的区别：
 *  - useNotificationHub 是「通知中心」SSE/偏好驱动，强调持久化与未读计数；
 *  - useToast 是轻量的即时讯息提示，强调多位置堆叠与自动消失。
 *
 * 用法：
 * ```vue
 * <script setup lang="ts">
 * import { useToast } from '@ydsz-core/ydsz-ui';
 *
 * const toast = useToast();
 * toast.success('操作成功');
 * toast.error('操作失败', { life: 5000 });
 * </script>
 *
 * <template>
 *   <!-- 容器自带默认渲染，无需再手写 YdToast -->
 *   <YdToastContainer :messages="toast.messages.value" />
 * </template>
 * ```
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\toast\use-toast.ts
 * @author ydsz-team
 * @since 26.10.11
 */

import type { ComputedRef } from 'vue';

import { computed, shallowRef } from 'vue';

import type {
  ToastConfig,
  ToastHandle,
  ToastMessage,
  ToastOptions,
  ToastPosition,
  UseToastReturn,
} from './types';

/* ============================================================ */
/* 全局单例 store                                                  */
/* ============================================================ */

/**
 * 全局 Toast 消息列表 —— 全部调用方共享。
 *
 * <p>必须用 shallowRef：消息项里的 icon 是 Vue 组件对象，深代理会把组件包成
 * reactive 对象（触发 Vue 警告且丢失引用相等），列表本身按整体替换的方式更新。
 */
const _messages = shallowRef<ToastMessage[]>([]);

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

/** 兜底默认值（configureToast 未覆盖时生效） */
const FALLBACK_CONFIG: Required<ToastConfig> = {
  life: 4500,
  maxVisible: 0,
  position: 'top-right',
};

/** 运行时可覆写的全局配置 */
const _config = shallowRef<Required<ToastConfig>>({ ...FALLBACK_CONFIG });

/**
 * 覆写全局 Toast 默认配置（时长 / 位置 / 最大可见数）。
 *
 * @param config - 需要覆盖的字段，未传字段保持原值
 * @returns 无
 */
export function configureToast(config: ToastConfig): void {
  _config.value = {
    life: config.life ?? _config.value.life,
    maxVisible: config.maxVisible ?? _config.value.maxVisible,
    position: config.position ?? _config.value.position,
  };
}

/* ============================================================ */
/* 内部操作                                                        */
/* ============================================================ */

/**
 * 构建一条完整的 ToastMessage（补全默认值）。
 *
 * @param options - 调用方传入的配置
 * @returns 补全后的消息项
 */
function buildMessage(options: ToastOptions): ToastMessage {
  return {
    closable: options.closable ?? true,
    createdAt: Date.now(),
    detail: options.detail,
    group: options.group,
    icon: options.icon,
    id: generateId(),
    life: options.life ?? _config.value.life,
    position: options.position ?? _config.value.position,
    severity: options.severity ?? 'info',
    summary: options.summary,
  };
}

/**
 * 将新消息接入全局列表顶部（最新在上），并按 maxVisible 截断最旧消息。
 *
 * @param message - 待插入的消息
 * @returns 无
 */
function pushMessage(message: ToastMessage): void {
  const next = [message, ..._messages.value];
  const max = _config.value.maxVisible;
  _messages.value = max > 0 ? next.slice(0, max) : next;
}

/**
 * 按 id 移除一条消息。
 *
 * @param id - 消息 id
 * @returns 无
 */
function removeById(id: string): void {
  _messages.value = _messages.value.filter((m) => m.id !== id);
}

/**
 * 按分组移除一组消息。
 *
 * @param group - 分组标识
 * @returns 无
 */
function removeByGroup(group: string): void {
  _messages.value = _messages.value.filter((m) => m.group !== group);
}

/**
 * 按位置移除一组消息。
 *
 * @param position - 展示位置
 * @returns 无
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
    id: message.id,
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
    messages,
    remove: removeById,
    removeByPosition,
    removeGroup: removeByGroup,
    removeAll: clearAll,
    success: successToast,
    warning: warningToast,
  };
}

export { messages };
