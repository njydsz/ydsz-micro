/**
 * SSE 通知多路复用桥接器 —— 将后端多类型 SSE 事件分派到通知 store。
 *
 * <p>演进说明：
 * <ul>
 *   <li>v1 (shared-auth/sse.ts)：单一连接，仅推送 auth.events 事件（登录过期等）</li>
 *   <li>v2 (本文件)：单连接多路复用，通过 SSE event 字段区分 4 类通知</li>
 * </ul>
 *
 * <p>后端约定：SSE 连接的 {@code event} 字段取值：
 * <ul>
 *   <li>{@code auth.events} → 登录/权限变更事件（沿用 v1 行为），前端 reload 或 redirect</li>
 *   <li>{@code notification.system} → 系统级广播（维护公告、告警）</li>
 *   <li>{@code notification.workflow} → 审批待办/流程结果通知</li>
 *   <li>{@code notification.message} → 消息未读计数 @提及增量</li>
 *   <li>{@code notification.audit} → 安全事件（异常登录、权限变更即时生效）</li>
 * </ul>
 *
 * <p>同一连接复用：减少服务端连接数，与 v1 共享 {@code /api/v1/auth/events} 端点，
 * 后端按事件类型投递到不同 event 通道。
 *
 * <p>在本应用 bootstrap 中调用一次 {@link setupSseNotificationBridge} 启动。
 *
 * @path comm/effects/shared-business/src/notification/sse-notification-bridge.ts
 * @author ydsz-team
 * @since 4.1.0 (P2-15)
 */

import {
  parseSseChunk,
  streamRequestAsync,
  type SseEvent,
} from '@YDSZ/shared-auth/sse';
import { useTokenStore } from '@ydsz/stores';

import { createLogger } from '@YDSZ-core/shared/utils';

import {
  useNotificationStore,
} from './notification-store';
import {
  NotificationItem,
  NotificationType,
  type SseEventType,
} from './notification-types';

const logger = createLogger('sse-notification-bridge');

/** SSE 端点（与 v1 auth.events 复用同一连接） */
const SSE_NOTIFICATION_ENDPOINT = '/api/v1/auth/events';

/** 重连基础延迟（ms），指数退避上限 */
const RECONNECT_BASE_DELAY = 3000;
const RECONNECT_MAX_DELAY = 30_000;
/** 最大连续重连次数（避免无限重连，超限后由 bootstrap 重新激活） */
const MAX_RECONNECT_ATTEMPTS = 10;

/** 模块单例状态 */
let reconnectAttempts = 0;
let isRunning = false;

/**
 * 解析 data JSON → NotificationItem（容错降级，解析失败时忽略此事件）。
 */
  function parseNotificationItem(type: SseEventType, data: string): NotificationItem | null {
  try {
    const obj = JSON.parse(data) as Record<string, unknown>;
    // 强制字段校验
    if (!obj.id || !obj.title) return null;

    // 根据 event 类型映射 NotificationType
    let notifType: NotificationType;
    switch (type) {
      case 'notification.system':
        notifType = NotificationType.SYSTEM;
        break;
      case 'notification.workflow':
        notifType = NotificationType.WORKFLOW;
        break;
      case 'notification.message':
        notifType = NotificationType.MESSAGE;
        break;
      case 'notification.audit':
        notifType = NotificationType.AUDIT;
        break;
      default:
        return null; // auth.events 不走通知中心
    }

    return {
      id: String(obj.id),
      type: notifType,
      title: String(obj.title),
      content: String(obj.content || ''),
      priority: (obj.priority as NotificationItem['priority']) || 'normal',
      timestamp: String(obj.timestamp || new Date().toISOString()),
      read: false,
      source: obj.source ? String(obj.source) : undefined,
      resourceId: obj.resourceId ? String(obj.resourceId) : undefined,
      link: obj.link ? String(obj.link) : undefined,
      actions: Array.isArray(obj.actions) ? (obj.actions as NotificationItem['actions']) : undefined,
      metadata: typeof obj.metadata === 'object' ? (obj.metadata as Record<string, unknown>) : undefined,
    };
  } catch {
    // 解析失败不阻断后续事件处理（防御性降级）
    return null;
  }
}

/**
 * 处理 auth.events（v1 已有语义，不入库通知中心，直接触发 reload/redirect）。
 */
function handleAuthEvent(event: SseEvent): void {
  try {
    const obj = JSON.parse(event.data) as Record<string, unknown>;
    const eventType = obj.type as string | undefined;
    if (eventType === 'TOKEN_EXPIRED' || eventType === 'SESSION_KICKED') {
      const tokenStore = useTokenStore();
      void tokenStore.refresh().catch(() => {
        // 刷新失败则跳转登录
        window.location.href = '/login';
      });
    }
  } catch {
    // ignore
  }
}

/**
 * 处理单条 SSE 事件 → 路由到通知中心 store。
 */
function routeSseEvent(event: SseEvent): void {
  const eventType = (event.event || 'message') as SseEventType;
  const store = useNotificationStore();

  // auth.events 分支：沿用 v1 行为
  if (eventType === 'auth.events') {
    handleAuthEvent(event);
    return;
  }

  // notification.* 分支：解析 → 推入通知中心
  const item = parseNotificationItem(eventType, event.data);
  if (item) {
    store.pushNotification(item);
  }
}

/**
 * 启动 SSE 通知桥接（幂等：重复调用无效）。
 *
 * <p>应在应用 bootstrap 阶段调用一次（如 main.ts 的 init 流程中）。
 *
 * @returns 停止函数（调用后断开 SSE 并清理状态）
 */
export function setupSseNotificationBridge(): () => void {
  if (isRunning) {
    return () => {
      /* already running, no-op teardown */
    };
  }
  isRunning = true;

  const tokenStore = useTokenStore();
  const notificationStore = useNotificationStore();
  const abortController = new AbortController();

  /**
   * 主连接循环（含自动重连）。
   */
  async function connect(): Promise<void> {
    while (isRunning && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      try {
        notificationStore.setConnected(false);
        reconnectAttempts++;

        const stream = streamRequestAsync({
          url: SSE_NOTIFICATION_ENDPOINT,
          method: 'GET',
          signal: abortController.signal,
          headers: {
            Authorization: `Bearer ${tokenStore.accessToken || ''}`,
          },
        });

        notificationStore.setConnected(true);
        reconnectAttempts = 0; // 连接成功，重置重连计数

        for await (const event of stream) {
          if (!isRunning) return;
          routeSseEvent(event);
        }

        // 流正常结束（服务端主动断开）→ 自动重连
      } catch (err) {
        if (!isRunning) return;
        // 记录错误（非阻塞，下一循环重试）
        logger.warn('[SSE-Notification] connection error:', err);
      }

      // 退避重连
      if (isRunning) {
        const delay = Math.min(
          RECONNECT_BASE_DELAY * Math.pow(2, reconnectAttempts - 1),
          RECONNECT_MAX_DELAY,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // 启动（不阻塞 bootstrap）
  void connect();

  // 返回停止函数
  return () => {
    isRunning = false;
    abortController.abort();
    notificationStore.setConnected(false);
  };
}
