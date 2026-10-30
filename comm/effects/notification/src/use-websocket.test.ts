/**
 * useWebSocket 组合式函数测试 —— 验证自动重连、指数退避与连接状态契约。
 *
 * <p>测试范围：指数退避重连次数与延迟、退避上限阈值、connectionStatus 状态转换、
 * 重连失败事件触发、connect() Promise 解析、disconnect 幂等性、手动重连。
 *
 * <p>使用 fake timer 控制等待时间，mock WebSocket 控制连接生命周期。
 *
 * @path comm\effects\notification\src\use-websocket.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useWebSocket } from './use-websocket';

// =====================================================================
// Mock WebSocket
// =====================================================================

/** 收集所有创建的 mock WS 实例 */
let mockInstances: MockWebSocket[];

/** mock WS 类，模拟真实 WebSocket 行为 */
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState: number = MockWebSocket.CONNECTING;
  onopen: ((this: WebSocket, ev: Event) => void) | null = null;
  onmessage: ((this: WebSocket, ev: MessageEvent) => void) | null = null;
  onerror: ((this: WebSocket, ev: Event) => void) | null = null;
  onclose: ((this: WebSocket, ev: CloseEvent) => void) | null = null;

  public sentMessages: string[] = [];
  public closeCode: number | null = null;
  public closeReason: string | null = null;

  constructor(public url: string, public protocols?: string | string[]) {
    mockInstances.push(this);
  }

  send(data: string): void {
    this.sentMessages.push(data);
  }

  close(code = 1000, reason = ''): void {
    this.closeCode = code;
    this.closeReason = reason;
    if (this.readyState === MockWebSocket.OPEN || this.readyState === MockWebSocket.CONNECTING) {
      this.readyState = MockWebSocket.CLOSED;
      // 异步模拟 close 事件
      const handler = this.onclose;
      setTimeout(() => {
        handler?.(new CloseEvent('close', { code, reason }));
      }, 0);
    }
  }

  /** 模拟连接成功 */
  simulateOpen(): void {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.(new Event('open'));
  }

  /** 模拟断开 */
  simulateClose(code: number, reason: string): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close', { code, reason }));
  }

  /** 模拟错误 */
  simulateError(): void {
    this.onerror?.(new Event('error'));
  }

  /** 模拟收到消息 */
  simulateMessage(data: string): void {
    this.onmessage?.(new MessageEvent('message', { data }));
  }
}

// =====================================================================
// 测试辅助
// =====================================================================

function createMockWsUrl(): string {
  return 'ws://test.example.com/ws';
}

// =====================================================================
// Suite
// =====================================================================

describe('useWebSocket', () => {
  beforeEach(() => {
    mockInstances = [];
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // 固定随机数 → jitter = 1.0
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.spyOn(Math, 'random').mockRestore();
  });

  // ---------------------------------------------------------------
  // 基本功能：connect() 返回 Promise，连接成功后 resolve
  // ---------------------------------------------------------------
  describe('connect()', () => {
    it('应在连接建立后 resolve Promise', async () => {
      const ws = useWebSocket(createMockWsUrl(), { autoConnect: false });
      const connectPromise = ws.connect();

      // 模拟连接成功
      expect(mockInstances).toHaveLength(1);
      mockInstances[0].simulateOpen();

      await expect(connectPromise).resolves.toBeUndefined();
      expect(ws.status()).toBe('OPEN');
      expect(ws.connectionStatus()).toBe('open');
      expect(ws.isConnected()).toBe(true);
    });

    it('若已连接则 connect() 立即 resolve', async () => {
      const ws = useWebSocket(createMockWsUrl(), { autoConnect: false });
      const firstConnect = ws.connect();
      mockInstances[0].simulateOpen();
      await firstConnect;

      // 第二次 connect 应该直接 resolve
      const secondConnect = ws.connect();
      await expect(secondConnect).resolves.toBeUndefined();
    });

    it('connectionStatus 在连接过程中应为 connecting', () => {
      const ws = useWebSocket(createMockWsUrl(), { autoConnect: false });
      ws.connect();

      expect(ws.connectionStatus()).toBe('connecting');
      expect(ws.status()).toBe('CONNECTING');
    });
  });

  // ---------------------------------------------------------------
  // 重连逻辑
  // ---------------------------------------------------------------
  describe('reconnect', () => {
    it('连接断开后应自动重连', async () => {
      const ws = useWebSocket(createMockWsUrl(), {
        autoConnect: false,
        reconnectBaseDelay: 1000,
        maxReconnectAttempts: 5,
      });

      const connectPromise = ws.connect();
      mockInstances[0].simulateOpen();
      await connectPromise;

      // 模拟异常断开（非手动断开）
      mockInstances[0].simulateClose(1001, 'abnormal');

      // 等待重连定时器
      await vi.advanceTimersByTimeAsync(1000);

      // 应该创建了新的 WebSocket 实例
      expect(mockInstances).toHaveLength(2);
      expect(ws.status()).toBe('CONNECTING');
      expect(ws.connectionStatus()).toBe('connecting');

      // 清理残留定时器
      ws.disconnect();
      await vi.runAllTimersAsync();
    });

    it('重连应使用指数退避延迟', async () => {
      const ws = useWebSocket(createMockWsUrl(), {
        autoConnect: false,
        reconnectBaseDelay: 1000,
        reconnectMaxDelay: 30_000,
        maxReconnectAttempts: 5,
      });

      // 第一次连接
      const connectPromise = ws.connect();
      mockInstances[0].simulateOpen();
      await connectPromise;

      // 第一次断开 -> 第 1 次重连 (baseDelay * 2^0 = 1000ms)
      mockInstances[0].simulateClose(1001, 'disconnect-1');
      await vi.advanceTimersByTimeAsync(1000);
      expect(mockInstances).toHaveLength(2);

      // 不模拟 open：实例 2 保持 CONNECTING → 立即断开 → 第 2 次重连
      // reconnectAttempts 现在是 1（第一次重连），所以 delay = 1000 * 2^(1-1) = 1000ms
      // 但 scheduleReconnect 会先 increment 到 2，所以 delay = 1000 * 2^(2-1) = 2000ms
      mockInstances[1].simulateClose(1001, 'disconnect-2');
      await vi.advanceTimersByTimeAsync(2000);
      expect(mockInstances).toHaveLength(3);

      mockInstances[2].simulateClose(1001, 'disconnect-3');
      // 第 3 次重连 (baseDelay * 2^(3-1) = 4000ms)
      await vi.advanceTimersByTimeAsync(3999);
      expect(mockInstances).toHaveLength(3); // 还没到时间

      await vi.advanceTimersByTimeAsync(1);
      expect(mockInstances).toHaveLength(4); // 现在重连了

      // 清理：断开连接并跳过所有残留定时器
      ws.disconnect();
      await vi.runAllTimersAsync();
    });

    it('重连延迟不应超过 maxReconnectDelay', async () => {
      const ws = useWebSocket(createMockWsUrl(), {
        autoConnect: false,
        reconnectBaseDelay: 1000,
        reconnectMaxDelay: 3000,
        maxReconnectAttempts: 10,
      });

      const connectPromise = ws.connect();
      mockInstances[0].simulateOpen();
      await connectPromise;

      // 连续失败：4 次断连，指数退避应被 maxDelay 截断
      // attempt 1: 1000ms, attempt 2: 2000ms, attempt 3: 3000ms (capped), attempt 4: 3000ms (capped)
      for (let i = 0; i < 4; i++) {
        mockInstances[i].simulateClose(1001, `disconnect-${i}`);
        await vi.advanceTimersByTimeAsync(3000);
      }

      // 4 次断连产生 4 个新实例（总共 5 个：原 + 4 次重连）
      expect(mockInstances).toHaveLength(5);

      // 清理残留定时器
      ws.disconnect();
      await vi.runAllTimersAsync();
    });

    it('超出 maxReconnectAttempts 后不应再重连', async () => {
      const onReconnectAttempt = vi.fn();
      const onReconnectFailed = vi.fn();

      const ws = useWebSocket(createMockWsUrl(), {
        autoConnect: false,
        reconnectBaseDelay: 100,
        maxReconnectAttempts: 3,
        onReconnectAttempt,
        onReconnectFailed,
      });

      const connectPromise = ws.connect();
      mockInstances[0].simulateOpen();
      await connectPromise;

      // 连续失败 3 次（不 open，确保不重置计数器）
      // attempt 1: delay = 100ms
      mockInstances[0].simulateClose(1001, 'disconnect-0');
      await vi.advanceTimersByTimeAsync(100);
      expect(mockInstances).toHaveLength(2);
      expect(ws.retryCount()).toBe(1);

      // attempt 2: delay = 200ms
      mockInstances[1].simulateClose(1001, 'disconnect-1');
      await vi.advanceTimersByTimeAsync(200);
      expect(mockInstances).toHaveLength(3);
      expect(ws.retryCount()).toBe(2);

      // attempt 3: delay = 400ms
      mockInstances[2].simulateClose(1001, 'disconnect-2');
      await vi.advanceTimersByTimeAsync(400);
      expect(mockInstances).toHaveLength(4);
      expect(ws.retryCount()).toBe(3);

      // 第 4 次断连时已超过 maxReconnectAttempts
      mockInstances[3].simulateClose(1001, 'disconnect-3');
      await vi.advanceTimersByTimeAsync(1000);

      // 不应再创建新实例（总共 4 个：首次 + 3 次重连）
      expect(mockInstances).toHaveLength(4);
      expect(ws.status()).toBe('CLOSED');
      expect(onReconnectFailed).toHaveBeenCalledTimes(1);

      // 清理残留定时器，避免影响后续测试
      ws.disconnect();
      await vi.runAllTimersAsync();
    });

    it('手动断开后不应触发重连', async () => {
      const ws = useWebSocket(createMockWsUrl(), {
        autoConnect: false,
        reconnectBaseDelay: 100,
        maxReconnectAttempts: 3,
      });

      const connectPromise = ws.connect();
      mockInstances[0].simulateOpen();
      await connectPromise;

      // 手动断开
      ws.disconnect();

      // 等待远超重连延迟（自动重连应在 100ms 内触发）
      await vi.advanceTimersByTimeAsync(5000);

      // 不应创建新的 WebSocket 实例
      expect(mockInstances).toHaveLength(1);
      expect(ws.status()).toBe('CLOSED');

      // 确保后续不被残留定时器影响
      ws.disconnect();
    });
  });

  // ---------------------------------------------------------------
  // 重连事件
  // ---------------------------------------------------------------
  describe('reconnect events', () => {
    it('应触发 onReconnectAttempt 事件并携带重试次数', async () => {
      const onReconnectAttempt = vi.fn();
      const ws = useWebSocket(createMockWsUrl(), {
        autoConnect: false,
        reconnectBaseDelay: 100,
        maxReconnectAttempts: 5,
        onReconnectAttempt,
      });

      const connectPromise = ws.connect();
      mockInstances[0].simulateOpen();
      await connectPromise;

      // 第 1 次断连（不 open，防止计数器重置）
      mockInstances[0].simulateClose(1001, 'disconnect-1');
      await vi.advanceTimersByTimeAsync(100);

      expect(onReconnectAttempt).toHaveBeenCalledTimes(1);
      expect(onReconnectAttempt).toHaveBeenCalledWith(1);

      // 第 2 次断开（连续失败，计数器递增）
      mockInstances[1].simulateClose(1001, 'disconnect-2');
      await vi.advanceTimersByTimeAsync(200);

      expect(onReconnectAttempt).toHaveBeenCalledTimes(2);
      expect(onReconnectAttempt).toHaveBeenCalledWith(2);

      // 清理残留定时器
      ws.disconnect();
      await vi.runAllTimersAsync();
    });

    it('应在超过最大重连次数后触发 onReconnectFailed', async () => {
      const onReconnectFailed = vi.fn();
      const ws = useWebSocket(createMockWsUrl(), {
        autoConnect: false,
        reconnectBaseDelay: 100,
        maxReconnectAttempts: 2,
        onReconnectFailed,
      });

      const connectPromise = ws.connect();
      mockInstances[0].simulateOpen();
      await connectPromise;

      // 连续失败 2 次（不 open，防止计数器重置）
      // 第 1 次断连 -> 重连
      mockInstances[0].simulateClose(1001, 'd1');
      await vi.advanceTimersByTimeAsync(100);

      // 第 2 次断连 -> 重连
      mockInstances[1].simulateClose(1001, 'd2');
      await vi.advanceTimersByTimeAsync(200);

      // 第 3 次断连 -> 已达上限（maxReconnectAttempts=2），不再重连
      mockInstances[2].simulateClose(1001, 'd3');
      await vi.advanceTimersByTimeAsync(1000);

      expect(onReconnectFailed).toHaveBeenCalledTimes(1);
      expect(ws.status()).toBe('CLOSED');
      // 总共 3 个实例（初始 + 2 次重连）
      expect(mockInstances).toHaveLength(3);

      // 清理残留定时器
      ws.disconnect();
      await vi.runAllTimersAsync();
    });
  });

  // ---------------------------------------------------------------
  // 连接状态转换
  // ---------------------------------------------------------------
  describe('connection status transitions', () => {
    it('应正确反映 connecting -> open -> closed -> reconnecting 状态转换', async () => {
      const ws = useWebSocket(createMockWsUrl(), {
        autoConnect: false,
        reconnectBaseDelay: 100,
        maxReconnectAttempts: 3,
      });

      // 初始状态
      expect(ws.connectionStatus()).toBe('closed');
      expect(ws.status()).toBe('CLOSED');

      // 开始连接
      ws.connect();
      expect(ws.connectionStatus()).toBe('connecting');
      expect(ws.status()).toBe('CONNECTING');

      // 连接成功
      mockInstances[0].simulateOpen();
      await vi.advanceTimersByTimeAsync(0);
      expect(ws.connectionStatus()).toBe('open');
      expect(ws.status()).toBe('OPEN');
    });

    it('断开后进入 reconnecting 状态', async () => {
      const ws = useWebSocket(createMockWsUrl(), {
        autoConnect: false,
        reconnectBaseDelay: 500,
        maxReconnectAttempts: 3,
      });

      const connectPromise = ws.connect();
      mockInstances[0].simulateOpen();
      await connectPromise;

      // 断开
      mockInstances[0].simulateClose(1001, 'abnormal');
      await vi.advanceTimersByTimeAsync(0);

      expect(ws.connectionStatus()).toBe('reconnecting');
      expect(ws.status()).toBe('RECONNECTING');
    });
  });

  // ---------------------------------------------------------------
  // disconnect 幂等性
  // ---------------------------------------------------------------
  describe('disconnect idempotency', () => {
    it('多次调用 disconnect 不应抛出错误', async () => {
      const ws = useWebSocket(createMockWsUrl(), { autoConnect: false });

      const connectPromise = ws.connect();
      mockInstances[0].simulateOpen();
      await connectPromise;

      expect(() => {
        ws.disconnect();
        ws.disconnect();
        ws.disconnect();
      }).not.toThrow();

      expect(ws.status()).toBe('CLOSED');
      expect(ws.connectionStatus()).toBe('closed');
      expect(ws.isConnected()).toBe(false);
    });

    it('未连接时调用 disconnect 应安全返回', () => {
      const ws = useWebSocket(createMockWsUrl(), { autoConnect: false });

      expect(() => ws.disconnect()).not.toThrow();
      expect(ws.status()).toBe('CLOSED');
    });
  });

  // ---------------------------------------------------------------
  // 手动重连
  // ---------------------------------------------------------------
  describe('manual reconnect', () => {
    it('reconnect() 应断开当前连接并重新连接', async () => {
      const ws = useWebSocket(createMockWsUrl(), {
        autoConnect: false,
        reconnectBaseDelay: 100,
      });

      // 初始连接
      const firstConnect = ws.connect();
      mockInstances[0].simulateOpen();
      await firstConnect;
      expect(ws.isConnected()).toBe(true);

      // 手动重连
      const reconnectPromise = ws.reconnect();
      // 应该创建新的 WebSocket 实例
      expect(mockInstances).toHaveLength(2);

      // 等待 close 事件处理
      await vi.advanceTimersByTimeAsync(0);

      // 模拟新连接成功
      mockInstances[1].simulateOpen();
      await reconnectPromise;

      expect(ws.isConnected()).toBe(true);
      expect(ws.status()).toBe('OPEN');
    });

    it('在重连过程中调用 reconnect() 应清除上次重连定时器', async () => {
      const ws = useWebSocket(createMockWsUrl(), {
        autoConnect: false,
        reconnectBaseDelay: 1000,
        maxReconnectAttempts: 5,
      });

      const connectPromise = ws.connect();
      mockInstances[0].simulateOpen();
      await connectPromise;

      // 触发自动重连
      mockInstances[0].simulateClose(1001, 'disconnect');
      await vi.advanceTimersByTimeAsync(500); // 还未到重连时间

      // 手动重连
      const reconnectPromise = ws.reconnect();
      mockInstances[1].simulateOpen();
      await reconnectPromise;

      expect(ws.isConnected()).toBe(true);

      // 前进时间，确认之前的自动重连定时器不会触发
      await vi.advanceTimersByTimeAsync(2000);
      // 应该只有 2 个实例（初始 + 手动重连）
      expect(mockInstances).toHaveLength(2);
    });
  });

  // ---------------------------------------------------------------
  // retryCount
  // ---------------------------------------------------------------
  describe('retryCount', () => {
    it('连接成功后应重置为 0', async () => {
      const ws = useWebSocket(createMockWsUrl(), {
        autoConnect: false,
        reconnectBaseDelay: 100,
        maxReconnectAttempts: 5,
      });

      const connectPromise = ws.connect();
      mockInstances[0].simulateOpen();
      await connectPromise;
      expect(ws.retryCount()).toBe(0);

      // 断开 -> 重连
      mockInstances[0].simulateClose(1001, 'd1');
      await vi.advanceTimersByTimeAsync(100);
      expect(ws.retryCount()).toBe(1);

      // 再次连接成功
      mockInstances[1].simulateOpen();
      await vi.advanceTimersByTimeAsync(0);
      expect(ws.retryCount()).toBe(0);
    });
  });
});

// =====================================================================
// 全局 mock WebSocket
// =====================================================================

vi.stubGlobal('WebSocket', MockWebSocket);
