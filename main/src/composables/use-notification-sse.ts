/**
 * SSE 桥接 composable —— 封装 shared-auth 的 streamRequest，订阅通知实时推送
 *
 * <p>封装 shared-auth 的 {@link streamRequest}，监听通知 SSE 端点，
 * 自动解析事件类型并分发给 {@link useNotificationStore}。
 *
 * <p>错误处理：指数退避重连（基于 {@link calculateRetryDelay}）。
 * 弱网/离线禁用：通过 navigator.onLine 判断 + online/offline 事件监听。
 *
 * <p><b>注意：</b>本 composable 应在应用挂载后的根组件中调用一次（如 layout 层），
 * 避免重复订阅造成 SSE 连接泄漏。
 *
 * @path main\src\composables\use-notification-sse.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { onMounted, onUnmounted, readonly, ref, type Ref } from 'vue';

import { calculateRetryDelay, createLogger } from '@ydsz/utils';
import { streamRequest, type SseEvent } from '@ydsz/shared-auth';

import { useNotificationStore } from '#/store/notification';

/** 模块级日志器 */
const logger = createLogger('NotificationSSE');

/** SSE 端点（streamRequest 走原生 fetch，不经 requestClient baseURL，需写网关注册的完整路径） */
const SSE_URL = import.meta.env.VITE_NOTIFICATION_SSE_URL ?? '/api/message/reactive/stream';

/** 最大重试次数 */
const MAX_RECONNECT_ATTEMPTS = 10;

/** 基础退避延迟（ms） */
const BASE_RECONNECT_DELAY = 2000;

/** 单例引用计数 —— 防止同一 composable 被多组件多次调用时开多个 SSE 连接 */
let refCount = 0;

/** 共享实例（单例） */
let sharedInstance: { stop: () => void; connected: ReturnType<typeof ref> } | null = null;

/**
 * 解析 SSE 原始数据帧为 JSON 对象（容错返回 null）。
 */
function parseSseFrame(raw: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (value !== null && typeof value === 'object') {
      return value as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 从 SSE 帧数据中解析事件类型。
 *
 * <p>支持两种后端契约：
 * <ul>
 *   <li>显式 event 字段：{@code {"event": "new_notification", "data": {...}}}</li>
 *   <li>SSE event 字段：由 streamRequest 提供的 event name 作为 event</li>
 * </ul>
 */
function resolveSseEventType(
  eventName: string,
  frame: Record<string, unknown> | null,
): string {
  if (frame && typeof frame.event === 'string') {
    return frame.event;
  }
  if (eventName && eventName !== 'message') {
    return eventName;
  }
  return 'unknown';
}

/**
 * SSE 连接状态
 */
type ConnectionState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

/**
 * 创建 SSE 连接，返回 stop 函数和 connected ref。
 *
 * v4.5 P1-12: 引入连接状态机，防止并发叠加；监听页面可见性；区分错误级别。
 */
function createSseConnection(
  store: ReturnType<typeof useNotificationStore>,
): { stop: () => void; connected: ReturnType<typeof ref<boolean>> } {
  let ac = new AbortController();
  const connected = ref(false);

  let state: ConnectionState = 'idle';
  let reconnectAttempts = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let isPageVisible = true;

  const stop = (): void => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (!ac.signal.aborted) {
      ac.abort();
    }
    state = 'disconnected';
  };

  /** 重新创建 AbortController（用于 abort 后重新连接） */
  function resetAbortController(): void {
    if (!ac.signal.aborted) {
      ac.abort();
    }
    ac = new AbortController();
  }

  /**
   * 调度重连（指数退避 + 抖动）。
   * v4.5 P1-12: 防止重复调度 — 已有重连定时器时不重复触发。
   */
  function scheduleReconnect(): void {
    if (state === 'disconnected') return;
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      logger.warn('[SSE] Max reconnection attempts reached, giving up.');
      state = 'disconnected';
      return;
    }
    if (navigator.onLine === false) {
      logger.info('[SSE] Offline, defer reconnection until online.');
      state = 'reconnecting';
      return;
    }
    if (!isPageVisible) {
      logger.info('[SSE] Page hidden, defer reconnection until visible.');
      state = 'reconnecting';
      return;
    }

    // 已有重连定时器时不重复调度
    if (reconnectTimer) return;

    const delay = calculateRetryDelay(reconnectAttempts, {
      baseDelay: BASE_RECONNECT_DELAY,
      backoff: 'exponential',
      jitter: 0.25,
    });

    state = 'reconnecting';
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      reconnectAttempts++;
      logger.info(
        `[SSE] Reconnecting (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`,
      );
      void runStream();
    }, delay);
  }

  /**
   * 发起 SSE 流请求。
   * v4.5 P1-12: 状态机防止并发连接 — 已有连接或正在连接时不重复发起。
   */
  async function runStream(): Promise<void> {
    // 已有连接或正在连接时不重复发起
    if (state === 'connecting' || state === 'connected') {
      logger.debug('[SSE] Connection already in progress, skip duplicate runStream.');
      return;
    }

    // 离线期不发起连接
    if (navigator.onLine === false) {
      logger.info('[SSE] Offline, skip connection attempt.');
      state = 'reconnecting';
      return;
    }

    // 页面隐藏时不发起连接
    if (!isPageVisible) {
      logger.info('[SSE] Page hidden, skip connection attempt.');
      state = 'reconnecting';
      return;
    }

    state = 'connecting';

    try {
      await streamRequest({
        url: SSE_URL,
        method: 'GET',
        signal: ac.signal,
        onEvent: (event: SseEvent) => {
          handleSseFrame(event);
        },
      });
      // 流正常结束（后端关闭连接）→ 尝试重连
      connected.value = false;
      store.setSseConnected(false);
      reconnectAttempts = 0;
      scheduleReconnect();
    } catch (error: unknown) {
      // abort 触发的错误不处理
      if (ac.signal.aborted) return;
      connected.value = false;
      store.setSseConnected(false);
      // v4.5 P1-12: 区分错误级别 — 普通断线用 warn，真实异常用 error
      if (state === 'disconnected') return;
      if (error instanceof Error && error.name === 'AbortError') {
        logger.warn('[SSE] Connection aborted.');
      } else {
        logger.warn('[SSE] Stream error (will retry):', error);
      }
      scheduleReconnect();
    }
  }

  /**
   * 处理 SSE 原始帧：解析 → 分发到 store。
   */
  function handleSseFrame(evt: SseEvent): void {
    const frame = parseSseFrame(evt.data);
    if (!frame) return;

    const eventType = resolveSseEventType(evt.event ?? 'message', frame);

    // 首次数据帧标记连接已建立
    if (!connected.value) {
      connected.value = true;
      store.setSseConnected(true);
      reconnectAttempts = 0;
      logger.info('[SSE] Notification stream connected.');
    }

    const message = {
      event: eventType,
      data: frame.data as Record<string, unknown> | undefined,
      notificationId: typeof frame.notificationId === 'string' ? frame.notificationId : undefined,
      count: typeof frame.count === 'number' ? frame.count : undefined,
      deletedId: typeof frame.deletedId === 'string' ? frame.deletedId : undefined,
    };

    store.handleSseMessage(message as Parameters<typeof store.handleSseMessage>[0]);
  }

  /**
   * 浏览器恢复在线时，重连 SSE。
   * v4.5 P1-12: 先 abort 当前连接，避免并发叠加。
   */
  function onOnline(): void {
    logger.info('[SSE] Browser online, attempting reconnect.');
    reconnectAttempts = 0;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    resetAbortController();
    state = 'idle';
    void runStream();
  }

  /**
   * 浏览器离线时，标记断开。
   * v4.5 P1-12: abort 当前连接，防止后台重连。
   */
  function onOffline(): void {
    logger.info('[SSE] Browser offline, stopping SSE.');
    connected.value = false;
    store.setSseConnected(false);
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (!ac.signal.aborted) {
      ac.abort();
    }
    state = 'reconnecting';
  }

  /**
   * 页面可见性变化处理。
   * v4.5 P1-12: 页面隐藏时暂停连接，恢复时重新连接。
   */
  function onVisibilityChange(): void {
    isPageVisible = document.visibilityState === 'visible';
    if (isPageVisible) {
      logger.info('[SSE] Page visible, resuming connection.');
      if (state === 'reconnecting' || state === 'disconnected') {
        resetAbortController();
        state = 'idle';
        reconnectAttempts = 0;
        void runStream();
      }
    } else {
      logger.info('[SSE] Page hidden, pausing connection.');
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      if (!ac.signal.aborted) {
        ac.abort();
      }
      connected.value = false;
      store.setSseConnected(false);
      state = 'reconnecting';
    }
  }

  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  document.addEventListener('visibilitychange', onVisibilityChange);

  // 启动流
  void runStream();

  return {
    stop: () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      stop();
    },
    connected,
  };
}

/**
 * Notification SSE Composable。
 *
 * <p>在应用根组件或 layout 中调用以建立 SSE 连接，返回只读 reactive 状态。
 * 同一 composable 多次调用时共享底层 SSE 连接（引用计数管理）。
 *
 * @returns SSE 状态与控制函数
 *   - {@code connected}: SSE 连接状态（只读）
 *   - {@code stop}: 手动断开连接
 */
export function useNotificationSse(): {
  connected: Readonly<Ref<boolean>>;
  stop: () => void;
} {
  const store = useNotificationStore();
  const localConnected = ref(false);
  let stopFn: (() => void) | null = null;

  onMounted(() => {
    refCount++;
    if (!sharedInstance) {
      sharedInstance = createSseConnection(store);
      stopFn = sharedInstance.stop;
    }
    localConnected.value = sharedInstance?.connected.value ?? false;
    if (!stopFn) {
      stopFn = sharedInstance?.stop ?? null;
    }
  });

  onUnmounted(() => {
    refCount = Math.max(0, refCount - 1);
    if (refCount === 0 && sharedInstance) {
      if (stopFn) stopFn();
      sharedInstance = null;
      stopFn = null;
    }
  });

  const readonlyConnected = readonly(localConnected);

  return {
    connected: readonlyConnected,
    stop: () => {
      if (stopFn && sharedInstance) {
        stopFn();
        sharedInstance = null;
        stopFn = null;
        refCount = 0;
      }
    },
  };
}
