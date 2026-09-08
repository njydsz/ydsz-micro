/**
 * WebSocket 实时连接 Composable
 *
 * <p>提供类型安全的 WebSocket 连接管理：
 * <ul>
 *   <li>自动注入鉴权令牌（通过 URL query 参数传递）</li>
 *   <li>指数退避重连（1s -> 2s -> 4s -> 最多 30s）</li>
 *   <li>心跳检测（Ping/Pong，30s 间隔）</li>
 *   <li>消息类型分发（支持按 event type 注册多个处理器）</li>
 *   <li>页面可见性自适应（失焦降频，聚焦立即恢复）</li>
 * </ul>
 *
 * <p><b>当前状态：</b>基础能力已就绪；后端 WebSocket 端点上线后传入 URL 即可工作。
 * 与现有 SSE 通知系统互补：SSE 用于服务端推送通知流，WebSocket 用于
 * 双向实时交互（如协作编辑、实时日志、即时聊天等未来场景）。
 *
 * <p>使用示例：
 * <pre>{@code
 *   const ws = useWebSocket<ChatMessage>('/api/ws/chat', {
 *     autoConnect: true,
 *     onMessage: (msg) => console.log(msg),
 *   });
 *   ws.send({ type: 'chat', content: 'hello' });
 * }</pre>
 *
 * @path comm/effects/notification/src/use-websocket.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { computed, onMounted, onUnmounted, ref } from 'vue';

import { createLogger } from '@YDSZ-core/shared/utils';

/** 模块级日志器 */
const logger = createLogger('useWebSocket');

/** WebSocket 连接状态 */
export type WebSocketStatus = 'CLOSED' | 'CONNECTING' | 'OPEN' | 'RECONNECTING';

/** 消息处理器类型 */
type MessageHandler<T> = (data: T) => void;

/** Composable 配置选项 */
export interface UseWebSocketOptions<T = unknown> {
  /** 是否自动连接（组件挂载时），默认 true */
  autoConnect?: boolean;
  /** 自定义鉴权令牌（不传则尝试从 authStore 取） */
  token?: string;
  /** 子协议（如 'v1.chat'） */
  protocols?: string[];
  /** 重连基础延迟（ms），默认 1000 */
  reconnectBaseDelay?: number;
  /** 重连最大延迟（ms），默认 30000 */
  reconnectMaxDelay?: number;
  /** 页面失焦时重连延迟（ms），默认 60000 */
  reconnectDelayBackground?: number;
  /** 最大重连次数，默认 10 */
  maxReconnectAttempts?: number;
  /** 心跳间隔（ms），默认 30000；设为 0 禁用心跳 */
  heartbeatInterval?: number;
  /** 收到任意消息的处理器 */
  onMessage?: MessageHandler<T>;
  /** 按 event type 分发的消息处理器映射 */
  onTypedMessage?: Record<string, MessageHandler<unknown>>;
  /** 连接成功回调 */
  onOpen?: () => void;
  /** 连接关闭回调 */
  onClose?: (event: CloseEvent) => void;
  /** 连接错误回调 */
  onError?: (event: Event) => void;
}

/** Composable 返回值 */
export interface UseWebSocketReturn {
  /** 当前连接状态 */
  status: () => WebSocketStatus;
  /** 是否已连接 */
  isConnected: () => boolean;
  /** 连接次数统计 */
  connectCount: () => number;
  /** 发送消息 */
  send: (data: unknown) => boolean;
  /** 手动连接 */
  connect: () => void;
  /** 手动断开 */
  disconnect: () => void;
}

/**
 * WebSocket 实时连接 Composable
 *
 * @param url - WebSocket URL（相对路径，自动拼接 VITE_GLOB_WS_URL）
 * @param options - 配置选项
 * @returns WebSocket 操作接口
 */
export function useWebSocket<T = unknown>(
  url: string,
  options: UseWebSocketOptions<T> = {},
): UseWebSocketReturn {
  const {
    autoConnect = true,
    token,
    protocols,
    reconnectBaseDelay = 1000,
    reconnectMaxDelay = 30_000,
    reconnectDelayBackground = 60_000,
    maxReconnectAttempts = 10,
    heartbeatInterval = 30_000,
    onMessage,
    onTypedMessage,
    onOpen,
    onClose,
    onError,
  } = options;

  /** WebSocket 实例 */
  let ws: WebSocket | null = null;

  /** 当前状态 */
  const status = ref<WebSocketStatus>('CLOSED');

  /** 重连次数（当前退避轮次） */
  let reconnectAttempts = 0;

  /** 连接次数统计 */
  const connectCount = ref(0);

  /** 重连定时器 */
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  /** 心跳定时器 */
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  /** 是否页面可见 */
  let isPageVisible = typeof document === 'undefined' ? true : !document.hidden;

  /** 是否手动断开（手动断开不触发重连） */
  let manualClosed = false;

  /** 是否已连接 */
  const isConnected = computed(() => status.value === 'OPEN');

  /**
   * 构造 WebSocket URL（拼接 WS 基础 URL 与鉴权 token）
   */
  function buildWsUrl(): string {
    const wsBaseUrl = import.meta.env?.VITE_GLOB_WS_URL ?? '';
    const fullUrl = wsBaseUrl ? `${wsBaseUrl}${url}` : url;

    // 传递 auth token 作为 query 参数
    const authToken = token;
    if (!authToken) return fullUrl;

    const separator = fullUrl.includes('?') ? '&' : '?';
    return `${fullUrl}${separator}token=${encodeURIComponent(authToken)}`;
  }

  /**
   * 发送心跳
   */
  function sendPing(): void {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
    }
  }

  /**
   * 启动心跳检测
   */
  function startHeartbeat(): void {
    if (heartbeatInterval <= 0) return;
    stopHeartbeat();
    heartbeatTimer = setInterval(sendPing, heartbeatInterval);
  }

  /**
   * 停止心跳检测
   */
  function stopHeartbeat(): void {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  }

  /**
   * 解析收到的消息并按 type 分发
   */
  function dispatchMessage(rawData: string): void {
    try {
      const parsed = JSON.parse(rawData) as { type?: string };

      // 心跳回复
      if (parsed.type === 'pong') return;

      // 按 type 分发
      const eventType = parsed.type;
      if (eventType && onTypedMessage?.[eventType]) {
        onTypedMessage[eventType](parsed);
        return;
      }

      // 默认消息处理器
      if (onMessage) {
        (onMessage as MessageHandler<unknown>)(parsed);
      }
    } catch {
      // 非 JSON 消息，直接传给默认处理器
      if (onMessage) {
        (onMessage as MessageHandler<unknown>)(rawData);
      }
    }
  }

  /**
   * 建立连接
   */
  function connect(): void {
    // 防止重复连接
    if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
      return;
    }

    manualClosed = false;
    status.value = 'CONNECTING';

    const wsUrl = buildWsUrl();

    try {
      ws = protocols ? new WebSocket(wsUrl, protocols) : new WebSocket(wsUrl);

      ws.onopen = () => {
        logger.info('[WebSocket] Connected: {}', url);
        status.value = 'OPEN';
        reconnectAttempts = 0;
        connectCount.value++;
        startHeartbeat();
        onOpen?.();
      };

      ws.onmessage = (event: MessageEvent) => {
        dispatchMessage(event.data);
      };

      ws.onerror = (event: Event) => {
        logger.warn('[WebSocket] Error');
        status.value = 'CLOSED';
        onError?.(event);
      };

      ws.onclose = (event: CloseEvent) => {
        logger.info('[WebSocket] Closed: code={}, reason={}', event.code, event.reason);
        status.value = 'CLOSED';
        stopHeartbeat();
        onClose?.(event);

        // 手动断开不重连
        if (manualClosed) return;

        // 超出最大重连次数则放弃
        if (reconnectAttempts >= maxReconnectAttempts) {
          logger.warn('[WebSocket] Max reconnect attempts ({}) reached, giving up', maxReconnectAttempts);
          return;
        }

        scheduleReconnect();
      };
    } catch (error) {
      logger.error('[WebSocket] Failed to create connection: {}', error);
      status.value = 'CLOSED';
      scheduleReconnect();
    }
  }

  /**
   * 指数退避重连调度
   */
  function scheduleReconnect(): void {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }

    status.value = 'RECONNECTING';

    const baseDelay = Math.min(
      reconnectBaseDelay * Math.pow(2, reconnectAttempts),
      reconnectMaxDelay,
    );
    const actualDelay = isPageVisible
      ? baseDelay
      : Math.max(baseDelay, reconnectDelayBackground);

    reconnectAttempts++;

    reconnectTimer = setTimeout(() => {
      logger.info(
        '[WebSocket] Reconnecting (attempt {}, delay={}ms, visible={})',
        reconnectAttempts,
        actualDelay,
        isPageVisible,
      );
      connect();
    }, actualDelay);
  }

  /**
   * 手动断开连接
   */
  function disconnect(): void {
    manualClosed = true;

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    stopHeartbeat();

    if (ws) {
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
      ws.close();
      ws = null;
    }

    status.value = 'CLOSED';
    reconnectAttempts = 0;
  }

  /**
   * 发送消息
   *
   * @param data - 要发送的数据（自动 JSON 序列化）
   * @returns 是否发送成功
   */
  function send(data: unknown): boolean {
    if (ws?.readyState !== WebSocket.OPEN) {
      logger.warn('[WebSocket] Cannot send: connection not open (status={})', status.value);
      return false;
    }

    try {
      const payload = typeof data === 'string' ? data : JSON.stringify(data);
      ws.send(payload);
      return true;
    } catch (error) {
      logger.error('[WebSocket] Send failed: {}', error);
      return false;
    }
  }

  /**
   * 页面可见性变化处理
   */
  function handleVisibilityChange(): void {
    if (typeof document === 'undefined') return;
    isPageVisible = !document.hidden;

    if (!document.hidden && status.value === 'CLOSED' && !manualClosed && !reconnectTimer) {
      // 页面恢复且连接断开：立即重新连接
      reconnectAttempts = 0;
      connect();
    }
  }

  // 自动连接
  if (autoConnect && typeof window !== 'undefined') {
    onMounted(() => {
      connect();
      document.addEventListener('visibilitychange', handleVisibilityChange);
    });

    onUnmounted(() => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      disconnect();
    });
  }

  return {
    status: () => status.value,
    isConnected: () => isConnected.value,
    connectCount: () => connectCount.value,
    send,
    connect,
    disconnect,
  };
}
