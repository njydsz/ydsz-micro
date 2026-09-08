/**
 * SSE 通知客户端 Composable —— 基于 EventSource API 订阅后端 SSE 端点
 *
 * <p>功能：
 * <ul>
 *   <li>基于 EventSource API 订阅后端 SSE 端点</li>
 *   <li>自动注入 Auth Header（使用 access-token）</li>
 *   <li>收到新通知消息时更新 Pinia Store</li>
 *   <li>支持断线重连（指数退避：1s → 2s → 4s → 8s → 最多 30s）</li>
 *   <li>提供 unreadCount, notifications, connect, disconnect 等响应式状态</li>
 *   <li>页面失焦时降低重连频率，激活时立即刷新</li>
 * </ul>
 *
 * <p>SSE 端点优先级：
 * <ol>
 *   <li>{@code /api/message/reactive/stream}（主通知流，text/event-stream）</li>
 *   <li>轮询 {@code /api/message/notifications/unread-count} 每 30 秒一次（备选）</li>
 * </ol>
 *
 * @path apps\system-web\src\composables\useNotificationSse.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { NotificationItem } from '#/store/notification';

import { computed, onMounted, onUnmounted, ref } from 'vue';

import { createLogger } from '@ydsz-core/shared/utils';

import {
  getNotificationsApi,
  getUnreadCountApi,
  markAllAsReadApi,
  markAsReadApi,
} from '#/api/core/notification';
import { useAuthStore } from '#/store';
import { useNotificationStore } from '#/store/notification';

/** 模块级日志器 */
const logger = createLogger('useNotificationSse');

/** SSE 主通知流端点（对齐后端 ReactiveNotificationController#streamEvents，贯通审计 P0-B） */
const SSE_NOTIFICATION_ENDPOINT = '/api/message/reactive/stream';
/** 重连基础延迟（ms） */
const RECONNECT_BASE_DELAY = 1000;
/** 重连最大延迟（ms） */
const RECONNECT_MAX_DELAY = 30_000;
/** 页面失焦时的重连延迟（ms）—— 降低频率 */
const RECONNECT_DELAY_BACKGROUND = 60_000;
/** 轮询间隔（ms） */
const POLLING_INTERVAL = 30_000;

/** 单例 SSE 实例（避免重复连接） */
let sseEventSource: EventSource | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
let pollingTimer: ReturnType<typeof setInterval> | null = null;
let isPageVisible = true;

// =====================================================================
// 对外开放的 API 模块函数（re-export，便于 store/composable 引用）
// =====================================================================

export { getNotificationsApi, getUnreadCountApi, markAllAsReadApi, markAsReadApi };

// =====================================================================
// Composable 实现
// =====================================================================

export function useNotificationSse() {
  const notificationStore = useNotificationStore();
  const authStore = useAuthStore();

  /** 当前是否正在使用 SSE */
  const useSSE = ref(true);

  /** 轮询中标志 */
  const polling = ref(false);

  /**
   * 计算属性：通知相关响应式状态（从 store 中解包）
   */
  const unreadCount = computed(() => notificationStore.unreadCount);
  const notifications = computed(() => notificationStore.notifications);
  const connected = computed(() => notificationStore.connected);
  const reconnecting = computed(() => notificationStore.reconnecting);

  /**
   * 解析 SSE 流中的 data 载荷。
   */
  function parseSseData(data: string): NotificationItem | null {
    try {
      const obj = JSON.parse(data) as Record<string, unknown>;
      if (!obj.id || !obj.title) return null;
      return {
        id: String(obj.id),
        title: String(obj.title),
        message: String(obj.content || obj.message || ''),
        type: String(obj.level || obj.type || 'INFO'),
        category: obj.category ? String(obj.category) : undefined,
        isRead: false,
        createdAt: String(
          obj.createdAt || obj.timestamp || new Date().toISOString(),
        ),
        avatar: obj.icon ? String(obj.icon) : undefined,
        link: obj.actionUrl ? String(obj.actionUrl) : undefined,
      };
    } catch {
      return null;
    }
  }

  /**
   * 连接 SSE。
   *
   * <p>EventSource 原生不支持自定义 Headers，需要通过 URL 传递 token 参数，
   * 或依赖 Cookie HttpOnly 鉴权模式。为兼顾两种情形，
   * 将 access-token 拼接到 query 参数中。
   */
  function connectSSE(): void {
    // 防止重复连接
    if (
      sseEventSource &&
      sseEventSource.readyState !== EventSource.CLOSED
    ) {
      return;
    }

    // 鉴权 token
    const token = authStore.accessToken;
    if (!token) {
      logger.warn('[SSE] 无 access-token，退化为轮询模式');
      useSSE.value = false;
      startPolling();
      return;
    }

    // 构造 URL（携带 token 作为 query 参数）
    const separator = SSE_NOTIFICATION_ENDPOINT.includes('?') ? '&' : '?';
    const sseUrl = `${SSE_NOTIFICATION_ENDPOINT}${separator}access-token=${encodeURIComponent(token)}`;

    try {
      sseEventSource = new EventSource(sseUrl, {
        withCredentials: true,
      });

      // 连接成功
      sseEventSource.onopen = () => {
        logger.info('[SSE] Notification stream connected');
        notificationStore.setConnected(true);
        reconnectAttempts = 0;
      };

      // 默认消息处理
      sseEventSource.onmessage = (event) => {
        const item = parseSseData(event.data);
        if (item) {
          notificationStore.addNotification(item);
        }
      };

      // 监听特定事件类型（custom event names）
      sseEventSource.addEventListener('notification', (event: MessageEvent) => {
        const item = parseSseData(event.data);
        if (item) {
          notificationStore.addNotification(item);
        }
      });

      // 监听未读计数更新
      sseEventSource.addEventListener(
        'unread_count',
        (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);
            const count = typeof data === 'number' ? data : data?.count;
            if (typeof count === 'number') {
              notificationStore.unreadCount = count;
            }
          } catch {
            // 忽略解析失败
          }
        },
      );

      // 连接断开
      sseEventSource.onerror = () => {
        logger.warn('[SSE] Connection error');
        notificationStore.setConnected(false);
        sseEventSource?.close();
        sseEventSource = null;

        // 指数退避重连
        scheduleReconnect();
      };
    } catch (error) {
      logger.error('[SSE] Failed to create EventSource:', error);
      notificationStore.setConnected(false);

      // EventSource 不可用（浏览器不支持 / 网络错误），退化为轮询
      useSSE.value = false;
      startPolling();
    }
  }

  /**
   * 断开 SSE 连接并清理资源。
   */
  function disconnectSSE(): void {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    if (sseEventSource) {
      sseEventSource.onopen = null;
      sseEventSource.onmessage = null;
      sseEventSource.onerror = null;
      sseEventSource.close();
      sseEventSource = null;
    }

    notificationStore.setConnected(false);
    reconnectAttempts = 0;
  }

  /**
   * 指数退避重连调度（页面激活时正常频率，失焦时降低频率）。
   */
  function scheduleReconnect(): void {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }

    notificationStore.setReconnecting(true);

    const baseDelay = Math.min(
      RECONNECT_BASE_DELAY * Math.pow(2, reconnectAttempts),
      RECONNECT_MAX_DELAY,
    );

    // 页面失焦时使用更长的重连间隔
    const actualDelay = isPageVisible
      ? baseDelay
      : Math.max(baseDelay, RECONNECT_DELAY_BACKGROUND);

    reconnectAttempts++;

    reconnectTimer = setTimeout(() => {
      logger.info(
        `[SSE] Reconnecting (attempt ${reconnectAttempts}, delay=${actualDelay}ms, visible=${isPageVisible})...`,
      );
      connectSSE();
    }, actualDelay);
  }

  // =====================================================================
  // 轮询模式备选（当 SSE 不可用时降级）
  // =====================================================================

  function startPolling(): void {
    if (polling.value) return;
    polling.value = true;

    // 立即同步一次
    void notificationStore.refreshUnreadCount();

    // 每 30 秒轮询一次
    pollingTimer = setInterval(() => {
      void notificationStore.refreshUnreadCount();
    }, POLLING_INTERVAL);
  }

  function stopPolling(): void {
    if (pollingTimer) {
      clearInterval(pollingTimer);
      pollingTimer = null;
    }
    polling.value = false;
  }

  // =====================================================================
  // 页面可见性处理
  // =====================================================================

  function handleVisibilityChange(): void {
    isPageVisible = !document.hidden;

    if (!document.hidden) {
      // 页面激活时立即刷新计数
      void notificationStore.refreshUnreadCount();

      // 如果 SSE 断开且不在重连中，立即重新连接
      if (
        !notificationStore.connected &&
        !notificationStore.reconnecting
      ) {
        reconnectAttempts = 0;
        connectSSE();
      }
    } else {
      // 页面失焦时不主动断开，只是重连频率已在 scheduleReconnect 中处理
      logger.info('[SSE] Page hidden, reconnection frequency reduced');
    }
  }

  // =====================================================================
  // 主动连接 / 断开
  // =====================================================================

  /**
   * 启动通知客户端（SSE 优先 + 轮询备选）。
   */
  function connect(): void {
    // 注册页面可见性监听
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 优先尝试 SSE
    connectSSE();
  }

  /**
   * 断开通知客户端（SSE + 轮询全停）。
   */
  function disconnect(): void {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    disconnectSSE();
    stopPolling();
    notificationStore.clearAll();
  }

  // =====================================================================
  // 自动生命周期
  // =====================================================================

  onMounted(() => {
    connect();
  });

  onUnmounted(() => {
    // 组件卸载时不调用 full disconnect（避免 popover close 时断开连接）
    // 仅清理页面可见性监听
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  });

  return {
    // 状态
    connected,
    notifications,
    polling,
    reconnecting,
    unreadCount,
    useSSE,

    // 方法
    connect,
    disconnect,
    markAllRead: () => notificationStore.markAllRead(),
    markRead: (id: string) => notificationStore.markRead(id),
    refreshUnreadCount: () => notificationStore.refreshUnreadCount(),
  };
}
