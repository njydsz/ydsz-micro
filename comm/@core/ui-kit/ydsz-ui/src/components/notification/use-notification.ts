/**
 * useNotification composable —— 全局 Notification 浮层命令式 API。
 *
 * 设计目标：
 *  - 提供与 useToast 对等的 Notification 命令式调用体验；
 *  - 全局唯一 store（跨组件共享），自动管理定时关闭；
 *  - 支持 add / success / info / warning / error / update / remove / removeAll。
 *
 * 与 useToast 的定位差异：
 *  - Toast：轻量即时讯息，右上角淡入淡出，不可交互（无按钮）；
 *  - Notification：带描述 + 级别图标 + 可常驻 + 可带 action 按钮的浮层通知。
 *
 * 用法：
 * ```vue
 * <script setup lang="ts">
 * import { useNotification, YdNotificationContainer } from '@ydsz-core/ydsz-ui';
 *
 * const notification = useNotification();
 * notification.success('保存成功');
 * notification.error('网络异常', { description: '请稍后重试', duration: 0 });
 * </script>
 *
 * <template>
 *   <YdNotificationContainer />
 * </template>
 * ```
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\notification\use-notification.ts
 * @author ydsz-team
 * @since 26.10.30
 */

import type { ComputedRef } from 'vue';

import { computed, shallowRef } from 'vue';

import type {
  NotificationConfig,
  NotificationHandle,
  NotificationMessage,
  NotificationOptions,
  UseNotificationReturn,
} from './types';

/* ============================================================ */
/* 全局单例 store                                                  */
/* ============================================================ */

/**
 * 全局 Notification 消息列表 —— 全部调用方共享。
 *
 * <p>shallowRef 避免对 icon 组件对象做深代理。
 */
const _messages = shallowRef<NotificationMessage[]>([]);

/** 全局消息列表的只读引用（供模板绑定） */
const messages: ComputedRef<NotificationMessage[]> = computed(() => _messages.value);

/** 自增 ID 后缀发生器 */
let _idCounter = 0;

/** 生成唯一 ID */
function generateId(): string {
  _idCounter += 1;
  return `ydsz-notification-${Date.now()}-${_idCounter}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

/* ============================================================ */
/* 默认配置                                                        */
/* ============================================================ */

/** 兜底默认值 */
const FALLBACK_CONFIG: Required<NotificationConfig> = {
  duration: 4500,
  maxVisible: 0,
  position: 'top-right',
};

/** 运行时可覆写的全局配置 */
const _config = shallowRef<Required<NotificationConfig>>({ ...FALLBACK_CONFIG });

/**
 * 覆写全局 Notification 默认配置。
 *
 * @param config - 需要覆盖的字段
 */
export function configureNotification(config: NotificationConfig): void {
  _config.value = {
    duration: config.duration ?? _config.value.duration,
    maxVisible: config.maxVisible ?? _config.value.maxVisible,
    position: config.position ?? _config.value.position,
  };
}

/* ============================================================ */
/* 内部操作                                                        */
/* ============================================================ */

/**
 * 构建一条完整的 NotificationMessage（补全默认值）。
 */
function buildMessage(options: NotificationOptions): NotificationMessage {
  return {
    createdAt: Date.now(),
    description: options.description,
    duration: options.duration ?? _config.value.duration,
    icon: options.icon,
    id: generateId(),
    message: options.message,
    position: options.position ?? _config.value.position,
    showIcon: options.showIcon ?? true,
    type: options.type ?? 'info',
  };
}

/**
 * 将新消息接入全局列表顶部，并按 maxVisible 截断最旧消息。
 */
function pushMessage(message: NotificationMessage): void {
  const next = [message, ..._messages.value];
  const max = _config.value.maxVisible;
  _messages.value = max > 0 ? next.slice(0, max) : next;
}

/**
 * 按 id 替换一条消息（用于 update）。
 */
function replaceMessage(id: string, options: Partial<NotificationOptions>): void {
  const idx = _messages.value.findIndex((m) => m.id === id);
  if (idx === -1) return;
  const existing = _messages.value[idx]!;
  const updated: NotificationMessage = {
    ...existing,
    ...options,
    // id 与 createdAt 不变
    id: existing.id,
    createdAt: existing.createdAt,
  };
  const next = [..._messages.value];
  next[idx] = updated;
  _messages.value = next;
}

/**
 * 按 id 移除一条消息。
 */
function removeById(id: string): void {
  _messages.value = _messages.value.filter((m) => m.id !== id);
}

/** 清空所有消息 */
function clearAll(): void {
  _messages.value = [];
}

/* ============================================================ */
/* 公开 API                                                       */
/* ============================================================ */

/**
 * 添加一条 Notification 浮层通知。
 *
 * @param options - 配置项（必填 message）
 * @returns 操作句柄
 */
function addNotification(options: NotificationOptions): NotificationHandle {
  const message = buildMessage(options);
  pushMessage(message);
  return {
    close: () => removeById(message.id),
    id: message.id,
  };
}

/**
 * 更新一条已存在的通知（局部合并）。
 */
function updateNotification(id: string, options: Partial<NotificationOptions>): void {
  replaceMessage(id, options);
}

function successNotification(message: string, options?: Partial<NotificationOptions>): NotificationHandle {
  return addNotification({ ...options, message, type: 'success' });
}

function infoNotification(message: string, options?: Partial<NotificationOptions>): NotificationHandle {
  return addNotification({ ...options, message, type: 'info' });
}

function warningNotification(message: string, options?: Partial<NotificationOptions>): NotificationHandle {
  return addNotification({ ...options, message, type: 'warning' });
}

function errorNotification(message: string, options?: Partial<NotificationOptions>): NotificationHandle {
  return addNotification({ ...options, message, type: 'error' });
}

/* ============================================================ */
/* 主 Composable                                                  */
/* ============================================================ */

/**
 * useNotification —— Notification 浮层命令式 API。
 *
 * @returns UseNotificationReturn 句柄
 *
 * @example
 * ```typescript
 * const notif = useNotification();
 * const handle = notif.success('操作完成');
 * // 2 秒后升级成警告
 * setTimeout(() => handle.close(), 2000);
 * notif.error('异常', { description: '请重试', duration: 0 });
 * ```
 */
export function useNotification(): UseNotificationReturn {
  return {
    add: addNotification,
    error: errorNotification,
    info: infoNotification,
    messages,
    remove: removeById,
    removeAll: clearAll,
    success: successNotification,
    update: updateNotification,
    warning: warningNotification,
  };
}

export { messages };
