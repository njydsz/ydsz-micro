/**
 * realtime 客户端 — WebSocket/SSE 统一实时通信封装
 *
 * @path comm\effects\shared-business\src\realtime\realtime-client.ts
 * @author ydsz-team
 * @since 1.1.0
 *
 * @remarks
 * 提供 WebSocket 连接管理能力：
 * - 自动重连（指数退避 + 抖动，最长 30s）
 * - 心跳保活（30s 间隔，ping/pong）
 * - 离线事件队列（断线期间的消息在重连后按序重放）
 * - 频道订阅（channel）模式，支持多监听器
 * - 跨 Tab 去重由业务层通过 globalState 处理
 */

import { createLogger } from '@YDSZ-core/shared/utils';
const logger = createLogger('realtime-client');

/** 重连配置 */
export interface RealtimeOptions {
  /** WebSocket 地址，如 wss://host/ws */
  url: string;
  /** 心跳间隔 ms，默认 30000 */
  heartbeatInterval?: number;
  /** 是否自动重连，默认 true */
  autoReconnect?: boolean;
  /** 最大重连次数，默认 10（-1 表示无限） */
  maxReconnectAttempts?: number;
  /** 是否启用离线消息队列，默认 true */
  offlineQueue?: boolean;
}

/** 连接状态 */
export type RealtimeStatus = 'connecting' | 'open' | 'closed' | 'reconnecting';

/** 消息处理器 */
type MessageHandler<T = unknown> = (payload: T, channel: string) => void;

/** 频道事件 */
interface ChannelListener<T = unknown> {
  channel: string;
  handler: MessageHandler<T>;
}

const HEARTBEAT_INTERVAL = 30_000;
const MAX_RECONNECT_ATTEMPTS = 10;
const MAX_QUEUE_SIZE = 100;

/**
 * WebSocket 实时通信客户端。
 *
 * 在裸 WebSocket 之上补齐生产环境必需的三项能力：断线自动重连、
 * 心跳保活、离线消息重放。业务侧只感知「订阅频道 / 发消息」，
 * 不感知底层连接生命周期。
 *
 * 设计取舍：
 * - **不做跨 Tab 去重**：多 Tab 同时在线时同一条消息会被多次投递，
 *   去重需要全局 leader 选举，成本高于收益，交由业务层用 globalState 判断。
 * - **不提供连接就绪 Promise**：调用方可能早于页面初始化就 subscribe，
 *   若返回 Promise 会迫使所有调用点 async 化；改为 send() 同步返回 false 表示未送达。
 * - **心跳走业务协议而非 WebSocket ping 帧**：浏览器未暴露 ping/pong API，
 *   只能在应用层用 `__heartbeat__` 频道收发，因此服务端必须配合忽略该频道。
 *
 * @example
 * ```ts
 * const client = new RealtimeClient({ url: 'wss://host/ws' });
 * const off = client.subscribe<OrderMsg>('order', (payload) => render(payload));
 * client.connect();
 * // 组件卸载时：off(); client.close();
 * ```
 *
 * @since 1.1.0
 */
export class RealtimeClient {
  private ws: WebSocket | null = null;
  private url: string;
  private heartbeatInterval: number;
  private autoReconnect: boolean;
  private maxReconnectAttempts: number;
  private offlineQueue: boolean;

  private status: RealtimeStatus = 'closed';
  private listeners: ChannelListener[] = [];
  private reconnectAttempts = 0;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private offlineMessages: Array<{ channel: string; payload: unknown }> = [];
  private manualClosed = false;

  constructor(options: RealtimeOptions) {
    this.url = options.url;
    this.heartbeatInterval = options.heartbeatInterval ?? HEARTBEAT_INTERVAL;
    this.autoReconnect = options.autoReconnect ?? true;
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? MAX_RECONNECT_ATTEMPTS;
    this.offlineQueue = options.offlineQueue ?? true;
  }

  /** 建立连接 */
  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    this.manualClosed = false;
    this.setStatus('connecting');

    try {
      this.ws = new WebSocket(this.url);
    } catch (error) {
      logger.error('[realtime] WebSocket 创建失败', error);
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.setStatus('open');
      this.startHeartbeat();
      // 重连成功后重放离线消息
      this.replayOffline();
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    this.ws.onclose = () => {
      this.stopHeartbeat();
      this.setStatus('closed');
      this.scheduleReconnect();
    };

    // 不在此处重连：WebSocket 规范规定 error 后必定紧随 close 事件，
    // 若两处都触发重连会创建两条并行连接且 reconnectAttempts 被双倍消耗。
    this.ws.onerror = () => {
      // onclose 会随后触发，统一走 scheduleReconnect
    };
  }

  /**
   * 关闭连接并终止重连。
   *
   * 与 `onclose` 触发的被动断开不同：这里置 `manualClosed` 为 true，
   * 使 `scheduleReconnect()` 直接返回，避免 `ws.close()` 引发的 onclose
   * 回调被误判为异常断线而再次重连。
   */
  close() {
    this.manualClosed = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
    this.setStatus('closed');
  }

  /**
   * 订阅频道消息
   *
   * @param channel - 频道名
   * @param handler - 消息回调 (payload, channel)
   * @returns 取消订阅函数
   */
  subscribe<T = unknown>(channel: string, handler: MessageHandler<T>): () => void {
    const listener: ChannelListener<T> = { channel, handler };
    this.listeners.push(listener as ChannelListener<unknown>);
    return () => {
      const idx = this.listeners.indexOf(listener as ChannelListener<unknown>);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  /** 发送消息（支持待连接时缓存） */
  send(data: unknown): boolean {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(typeof data === 'string' ? data : JSON.stringify(data));
      return true;
    }
    return false;
  }

  /** 当前连接状态 */
  getStatus(): RealtimeStatus {
    return this.status;
  }

  // ===== 内部实现 =====

  private setStatus(status: RealtimeStatus) {
    this.status = status;
  }

  private handleMessage(raw: unknown) {
    let message: { channel?: string; payload?: unknown } | null = null;
    try {
      message = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
      message = { payload: raw };
    }

    const channel = message?.channel ?? '';
    const payload = message?.payload ?? message;

    // 心跳响应是连接健康检查的回声，不属于业务消息，若下发给监听器
    // 会被误当作频道 '__heartbeat__' 的订阅数据
    if (channel === '__heartbeat__') return;

    const matched = this.listeners.filter((l) => l.channel === channel);
    if (matched.length > 0) {
      matched.forEach((l) => l.handler(payload, channel));
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.send(JSON.stringify({ channel: '__heartbeat__', payload: { ts: Date.now() } }));
    }, this.heartbeatInterval);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect() {
    if (this.manualClosed || !this.autoReconnect) return;
    if (this.maxReconnectAttempts >= 0 && this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.warn('[realtime] 重连次数已达上限，停止重连');
      return;
    }

    // 指数退避 + 抖动：2^n * 1s ± 30%，上限 30s
    const base = Math.min(2 ** this.reconnectAttempts * 1000, 30_000);
    // 抖动不可省：服务端重启后所有客户端会在同一秒重连，形成重连风暴
    // 把已恢复的服务再次打垮；乘 0.7~1.3 让重试时刻在窗口内打散
    const jitter = base * (0.7 + Math.random() * 0.6);
    this.reconnectAttempts += 1;
    this.setStatus('reconnecting');

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, jitter);
  }

  private replayOffline() {
    if (!this.offlineQueue || this.offlineMessages.length === 0) return;
    const messages = [...this.offlineMessages];
    // 先清空再分发：分发过程中若监听器再次 dispatch，新消息进的是新队列，
    // 不会被本次遍历重复消费
    this.offlineMessages = [];
    // 传入对象而非字符串，复用 handleMessage 的非字符串分支，避免序列化往返
    messages.forEach((msg) => this.handleMessage(msg));
  }

  /** 业务侧可调用：写入离线消息（若已连接则直接分发） */
  dispatch(channel: string, payload: unknown) {
    if (this.status === 'open') {
      this.handleMessage(JSON.stringify({ channel, payload }));
      return;
    }
    if (this.offlineQueue) {
      // 丢弃队首而非拒绝入队：实时消息的价值随时间衰减，
      // 保留最新 N 条比保留最早的 N 条更有意义，同时也给队列设了内存上限
      if (this.offlineMessages.length >= MAX_QUEUE_SIZE) {
        this.offlineMessages.shift();
      }
      this.offlineMessages.push({ channel, payload });
    }
  }
}
