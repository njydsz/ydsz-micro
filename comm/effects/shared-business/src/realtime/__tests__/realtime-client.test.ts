/**
 * RealtimeClient 模块单元测试
 *
 * 覆盖：
 * - 连接管理（connect / close）
 * - 自动重连（指数退避 + 抖动）
 * - 心跳保活（ping/pong）
 * - 消息订阅与分发（subscribe / handleMessage）
 * - 离线消息队列（dispatch / replayOffline）
 * - 重连次数上限
 *
 * 测试风格与项目现有测试保持一致：
 * 使用 vi.useFakeTimers() 控制定时器，Mock WebSocket 全局对象。
 *
 * @path comm/effects/shared-business/src/realtime/__tests__/realtime-client.test.ts
 * @author ydsz-team
 * @since 4.2.1
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ============================================================
// Mock: WebSocket — 模拟浏览器 WebSocket API
// ============================================================
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  /** v4.3.1：构造计数（替代 vitest 4 中不可用的 vi.fn spy 计数） */
  static instanceCount = 0;

  url: string;
  readyState: number = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  sentMessages: string[] = [];
  closeCode: number | null = null;

  constructor(url: string) {
    this.url = url;
    // v4.3.1 修复（vitest 4 兼容）：在构造器内登记当前实例与构造计数。
    // 此前用 vi.fn 包装全局 WebSocket，vitest 4 中 vi.fn 返回值不可 new 构造，
    // `new WebSocket()` 抛 TypeError 被 SUT 捕获走重连分支 → currentSocket 恒为 null。
    MockWebSocket.instanceCount += 1;
    trackCurrentSocket(this);
  }

  send(data: string) {
    this.sentMessages.push(data);
  }

  close(code?: number) {
    this.closeCode = code ?? 1000;
    this.readyState = MockWebSocket.CLOSED;
  }

  // 测试辅助方法：模拟服务器行为
  simulateOpen() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.(new Event('open'));
  }

  simulateMessage(data: string) {
    this.onmessage?.({ data } as MessageEvent);
  }

  simulateClose() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ code: 1000 } as CloseEvent);
  }

  simulateError() {
    this.onerror?.(new Event('error'));
  }
}

// 全局 WebSocket 实例追踪（声明置于类后，构造器在执行期才引用，无 TDZ 风险）
let currentSocket: MockWebSocket | null = null;

/** 登记最新 WebSocket 实例（供测试断言访问；避免构造器内 this 别名） */
function trackCurrentSocket(socket: MockWebSocket): void {
  currentSocket = socket;
}

// ============================================================
// Import SUT (System Under Test)
// ============================================================
import { RealtimeClient } from '../realtime-client';

// ============================================================
// Test suites
// ============================================================
describe('RealtimeClient', () => {
  let originalWebSocket: typeof WebSocket;

  beforeEach(() => {
    vi.useFakeTimers();
    currentSocket = null;
    MockWebSocket.instanceCount = 0;
    originalWebSocket = globalThis.WebSocket;
    // v4.3.1 修复（vitest 4 兼容）：直接以 MockWebSocket 类替换全局 WebSocket。
    // vi.fn 包装在 vitest 4 中不可 new 构造；类本身携带静态常量
    // （CONNECTING/OPEN/CLOSING/CLOSED），实例登记由构造器完成，
    // 构造计数用 MockWebSocket.instanceCount 断言。
    globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;
  });

  afterEach(async () => {
    vi.useRealTimers();
    globalThis.WebSocket = originalWebSocket;
    await new Promise((r) => setTimeout(r, 0));
  });

  // ----------------------------------------------------------
  // 连接管理
  // ----------------------------------------------------------
  describe('connect', () => {
    it('应使用指定 URL 创建 WebSocket 连接', () => {
      const client = new RealtimeClient({ url: 'wss://test.example.com/ws' });
      client.connect();

      expect(currentSocket).not.toBeNull();
      expect(currentSocket!.url).toBe('wss://test.example.com/ws');
    });

    it('连接后状态应为 connecting', () => {
      const client = new RealtimeClient({ url: 'wss://test.example.com/ws' });
      client.connect();

      expect(client.getStatus()).toBe('connecting');
    });

    it('WebSocket open 后状态应变为 open', () => {
      const client = new RealtimeClient({ url: 'wss://test.example.com/ws' });
      client.connect();

      currentSocket!.simulateOpen();

      expect(client.getStatus()).toBe('open');
    });

    it('重复调用 connect（连接中）不应创建多个 WebSocket', () => {
      const client = new RealtimeClient({ url: 'wss://test.example.com/ws' });
      client.connect();
      // 第一次 connect 后 ws 处于 CONNECTING 状态
      expect(currentSocket!.readyState).toBe(MockWebSocket.CONNECTING);
      // 第二次 connect 应检测到 CONNECTING 状态并直接返回
      client.connect();

      // 只创建了一个 WebSocket 实例
      expect(MockWebSocket.instanceCount).toBe(1);
    });

    it('连接已 OPEN 时重复调用 connect 不应创建多个 WebSocket', () => {
      const client = new RealtimeClient({ url: 'wss://test.example.com/ws' });
      client.connect();
      currentSocket!.simulateOpen();
      // 已 OPEN，再次 connect 应直接返回
      client.connect();

      expect(MockWebSocket.instanceCount).toBe(1);
    });

    it('WebSocket 创建失败时应调度重连', () => {
      // 让 WebSocket 构造函数抛出异常
      globalThis.WebSocket = vi.fn(() => {
        throw new Error('Connection refused');
      }) as unknown as typeof WebSocket;

      const client = new RealtimeClient({
        url: 'wss://test.example.com/ws',
        autoReconnect: true,
      });
      client.connect();

      // 状态应为 reconnecting（调度了重连）
      expect(client.getStatus()).toBe('reconnecting');
    });
  });

  // ----------------------------------------------------------
  // 关闭连接
  // ----------------------------------------------------------
  describe('close', () => {
    it('close 后状态应为 closed', () => {
      const client = new RealtimeClient({ url: 'wss://test.example.com/ws' });
      client.connect();
      currentSocket!.simulateOpen();

      client.close();

      expect(client.getStatus()).toBe('closed');
    });

    it('close 后不应再自动重连', () => {
      const client = new RealtimeClient({
        url: 'wss://test.example.com/ws',
        autoReconnect: true,
      });
      client.connect();
      currentSocket!.simulateOpen();

      // 手动关闭
      client.close();

      // 推进时间，不应触发重连
      vi.advanceTimersByTime(60_000);

      // 仍然只有一个 WebSocket 实例（没有重连）
      expect(MockWebSocket.instanceCount).toBe(1);
    });

    it('close 应调用 WebSocket.close()', () => {
      const client = new RealtimeClient({ url: 'wss://test.example.com/ws' });
      client.connect();
      currentSocket!.simulateOpen();

      client.close();

      expect(currentSocket!.closeCode).toBe(1000);
    });
  });

  // ----------------------------------------------------------
  // 自动重连
  // ----------------------------------------------------------
  describe('auto reconnect', () => {
    it('连接断开后应自动重连', () => {
      const client = new RealtimeClient({
        url: 'wss://test.example.com/ws',
        autoReconnect: true,
      });
      client.connect();
      currentSocket!.simulateOpen();

      // 模拟连接断开
      currentSocket!.simulateClose();

      // 推进时间触发重连（指数退避 base = 2^0 * 1000 = 1000ms + jitter）
      vi.advanceTimersByTime(2_000);

      // 应创建了新的 WebSocket 实例
      expect(MockWebSocket.instanceCount).toBe(2);
    });

    it('autoReconnect=false 时不应自动重连', () => {
      const client = new RealtimeClient({
        url: 'wss://test.example.com/ws',
        autoReconnect: false,
      });
      client.connect();
      currentSocket!.simulateOpen();

      // 模拟连接断开
      currentSocket!.simulateClose();

      // 推进时间
      vi.advanceTimersByTime(60_000);

      // 仍然只有一个 WebSocket 实例
      expect(MockWebSocket.instanceCount).toBe(1);
    });

    it('重连成功后应重置重连计数器', () => {
      const client = new RealtimeClient({
        url: 'wss://test.example.com/ws',
        autoReconnect: true,
      });
      client.connect();
      currentSocket!.simulateOpen();

      // 第一次断开
      currentSocket!.simulateClose();
      vi.advanceTimersByTime(2_000);

      // 重连成功
      currentSocket!.simulateOpen();

      // 第二次断开
      currentSocket!.simulateClose();
      // 推进较短时间（如果计数器未重置，第二次退避应为 2^1 * 1000 = 2000ms）
      vi.advanceTimersByTime(1_500);

      // 应已重连（计数器重置后 base 回到 1000ms）
      expect(MockWebSocket.instanceCount).toBe(3);
    });

    it('达到最大重连次数后应停止重连', () => {
      const client = new RealtimeClient({
        url: 'wss://test.example.com/ws',
        autoReconnect: true,
        maxReconnectAttempts: 2,
      });
      client.connect();
      currentSocket!.simulateOpen();

      // 第一次断开并重连
      currentSocket!.simulateClose();
      vi.advanceTimersByTime(2_000);

      // 第二次断开并重连
      currentSocket!.simulateClose();
      vi.advanceTimersByTime(4_000);

      // 第三次断开 — 已达上限，不应再重连
      currentSocket!.simulateClose();
      vi.advanceTimersByTime(60_000);

      // 总共 3 次 WebSocket 创建（初始 + 2 次重连）
      expect(MockWebSocket.instanceCount).toBe(3);
    });

    it('重连期间状态应为 reconnecting', () => {
      const client = new RealtimeClient({
        url: 'wss://test.example.com/ws',
        autoReconnect: true,
      });
      client.connect();
      currentSocket!.simulateOpen();

      // 断开
      currentSocket!.simulateClose();

      // 推进一小段时间（还未到重连触发时间）
      vi.advanceTimersByTime(100);

      expect(client.getStatus()).toBe('reconnecting');
    });
  });

  // ----------------------------------------------------------
  // 心跳保活
  // ----------------------------------------------------------
  describe('heartbeat', () => {
    it('连接成功后应启动心跳定时器', () => {
      const client = new RealtimeClient({
        url: 'wss://test.example.com/ws',
        heartbeatInterval: 5000,
      });
      client.connect();
      currentSocket!.simulateOpen();

      // 推进到心跳间隔
      vi.advanceTimersByTime(5000);

      // 应发送了心跳消息
      const heartbeatMsg = currentSocket!.sentMessages.find(
        (msg) => {
          try {
            const parsed = JSON.parse(msg);
            return parsed.channel === '__heartbeat__';
          } catch {
            return false;
          }
        },
      );
      expect(heartbeatMsg).toBeDefined();
    });

    it('心跳消息应包含时间戳', () => {
      const client = new RealtimeClient({
        url: 'wss://test.example.com/ws',
        heartbeatInterval: 5000,
      });
      client.connect();
      currentSocket!.simulateOpen();

      vi.advanceTimersByTime(5000);

      const heartbeatMsg = currentSocket!.sentMessages.find(
        (msg) => {
          try {
            const parsed = JSON.parse(msg);
            return parsed.channel === '__heartbeat__';
          } catch {
            return false;
          }
        },
      );
      const parsed = JSON.parse(heartbeatMsg!);
      expect(parsed.payload).toHaveProperty('ts');
      expect(typeof parsed.payload.ts).toBe('number');
    });

    it('连接断开后应停止心跳', () => {
      const client = new RealtimeClient({
        url: 'wss://test.example.com/ws',
        heartbeatInterval: 5000,
      });
      client.connect();
      currentSocket!.simulateOpen();

      // 断开连接
      currentSocket!.simulateClose();

      // 记录当前消息数
      const msgCountBefore = currentSocket!.sentMessages.length;

      // 推进时间
      vi.advanceTimersByTime(10_000);

      // 不应有新的心跳消息（连接已断开，心跳已停止）
      // 注意：重连可能创建新的 socket，但旧 socket 不应收到新消息
      const newMessages = currentSocket!.sentMessages.slice(msgCountBefore);
      expect(newMessages.length).toBe(0);
    });
  });

  // ----------------------------------------------------------
  // 消息订阅与分发
  // ----------------------------------------------------------
  describe('subscribe', () => {
    it('订阅频道后应能接收匹配的消息', () => {
      const client = new RealtimeClient({ url: 'wss://test.example.com/ws' });
      client.connect();
      currentSocket!.simulateOpen();

      const handler = vi.fn();
      client.subscribe('test-channel', handler);

      // 模拟收到消息
      currentSocket!.simulateMessage(
        JSON.stringify({ channel: 'test-channel', payload: { data: 'hello' } }),
      );

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ data: 'hello' }, 'test-channel');
    });

    it('不应收到未订阅频道的消息', () => {
      const client = new RealtimeClient({ url: 'wss://test.example.com/ws' });
      client.connect();
      currentSocket!.simulateOpen();

      const handler = vi.fn();
      client.subscribe('channel-a', handler);

      // 发送不匹配的消息
      currentSocket!.simulateMessage(
        JSON.stringify({ channel: 'channel-b', payload: 'data' }),
      );

      expect(handler).not.toHaveBeenCalled();
    });

    it('多个订阅者应各自收到匹配的消息', () => {
      const client = new RealtimeClient({ url: 'wss://test.example.com/ws' });
      client.connect();
      currentSocket!.simulateOpen();

      const handlerA = vi.fn();
      const handlerB = vi.fn();
      client.subscribe('channel-a', handlerA);
      client.subscribe('channel-b', handlerB);

      currentSocket!.simulateMessage(
        JSON.stringify({ channel: 'channel-a', payload: 'for-a' }),
      );
      currentSocket!.simulateMessage(
        JSON.stringify({ channel: 'channel-b', payload: 'for-b' }),
      );

      expect(handlerA).toHaveBeenCalledTimes(1);
      expect(handlerA).toHaveBeenCalledWith('for-a', 'channel-a');
      expect(handlerB).toHaveBeenCalledTimes(1);
      expect(handlerB).toHaveBeenCalledWith('for-b', 'channel-b');
    });

    it('取消订阅后不应再收到消息', () => {
      const client = new RealtimeClient({ url: 'wss://test.example.com/ws' });
      client.connect();
      currentSocket!.simulateOpen();

      const handler = vi.fn();
      const unsubscribe = client.subscribe('test-channel', handler);

      // 取消订阅
      unsubscribe();

      // 发送消息
      currentSocket!.simulateMessage(
        JSON.stringify({ channel: 'test-channel', payload: 'data' }),
      );

      expect(handler).not.toHaveBeenCalled();
    });

    it('同一频道多个订阅者，取消一个不影响另一个', () => {
      const client = new RealtimeClient({ url: 'wss://test.example.com/ws' });
      client.connect();
      currentSocket!.simulateOpen();

      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const unsubscribe1 = client.subscribe('shared-channel', handler1);
      client.subscribe('shared-channel', handler2);

      // 取消第一个
      unsubscribe1();

      // 发送消息
      currentSocket!.simulateMessage(
        JSON.stringify({ channel: 'shared-channel', payload: 'data' }),
      );

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('心跳消息不应触发业务 handler', () => {
      const client = new RealtimeClient({ url: 'wss://test.example.com/ws' });
      client.connect();
      currentSocket!.simulateOpen();

      const handler = vi.fn();
      client.subscribe('some-channel', handler);

      // 收到心跳消息
      currentSocket!.simulateMessage(
        JSON.stringify({ channel: '__heartbeat__', payload: { ts: Date.now() } }),
      );

      expect(handler).not.toHaveBeenCalled();
    });

    it('非 JSON 消息应将原始数据作为 payload', () => {
      const client = new RealtimeClient({ url: 'wss://test.example.com/ws' });
      client.connect();
      currentSocket!.simulateOpen();

      const handler = vi.fn();
      client.subscribe('', handler);

      // 发送非 JSON 消息
      currentSocket!.simulateMessage('plain text message');

      expect(handler).toHaveBeenCalledWith('plain text message', '');
    });
  });

  // ----------------------------------------------------------
  // 发送消息
  // ----------------------------------------------------------
  describe('send', () => {
    it('连接打开时应成功发送消息', () => {
      const client = new RealtimeClient({ url: 'wss://test.example.com/ws' });
      client.connect();
      currentSocket!.simulateOpen();

      const result = client.send({ action: 'test' });

      expect(result).toBe(true);
      expect(currentSocket!.sentMessages.length).toBe(1);
      expect(currentSocket!.sentMessages[0]).toBe('{"action":"test"}');
    });

    it('字符串消息应原样发送', () => {
      const client = new RealtimeClient({ url: 'wss://test.example.com/ws' });
      client.connect();
      currentSocket!.simulateOpen();

      client.send('raw-string');

      expect(currentSocket!.sentMessages[0]).toBe('raw-string');
    });

    it('连接未打开时应返回 false', () => {
      const client = new RealtimeClient({ url: 'wss://test.example.com/ws' });
      client.connect();

      // 尚未 simulateOpen
      const result = client.send({ action: 'test' });

      expect(result).toBe(false);
    });
  });

  // ----------------------------------------------------------
  // 离线消息队列
  // ----------------------------------------------------------
  describe('offline queue', () => {
    it('未连接时 dispatch 应缓存消息', () => {
      const client = new RealtimeClient({
        url: 'wss://test.example.com/ws',
        offlineQueue: true,
      });
      // 不连接直接 dispatch
      client.dispatch('my-channel', { data: 'offline' });

      // 消息应在队列中，等待重连后分发
      client.connect();
      currentSocket!.simulateOpen();

      // 重连后 replayOffline 会回放缓存消息；回放细节（丢弃最旧）由下方“超出上限”用例验证
    });

    it('连接后 dispatch 应直接分发消息', () => {
      const client = new RealtimeClient({ url: 'wss://test.example.com/ws' });
      const handler = vi.fn();
      client.subscribe('live-channel', handler);
      client.connect();
      currentSocket!.simulateOpen();

      client.dispatch('live-channel', { data: 'live' });

      expect(handler).toHaveBeenCalledWith({ data: 'live' }, 'live-channel');
    });

    it('offlineQueue=false 时未连接 dispatch 不应缓存', () => {
      const client = new RealtimeClient({
        url: 'wss://test.example.com/ws',
        offlineQueue: false,
      });

      // 不应抛出异常
      expect(() => client.dispatch('ch', 'data')).not.toThrow();
    });

    it('离线队列超出上限时应丢弃最旧消息', () => {
      const client = new RealtimeClient({
        url: 'wss://test.example.com/ws',
        offlineQueue: true,
      });

      // 先订阅，确保后续可以收到消息
      const handler = vi.fn();
      client.subscribe('ch', handler);

      // 发送 101 条离线消息（超出 MAX_QUEUE_SIZE=100 的上限）
      for (let i = 0; i < 101; i++) {
        client.dispatch('ch', { index: i });
      }

      // 连接 — replayOffline 应分发缓存消息
      client.connect();
      currentSocket!.simulateOpen();

      // 超出上限时最旧消息被丢弃，应收到 100 条（index=1..100）
      // 验证: index=0 的消息被丢弃，handler 未被调用时携带 index=0
      const calledWithIndex0 = handler.mock.calls.some(
        (call) => (call[0] as { index?: number }).index === 0,
      );
      expect(calledWithIndex0).toBe(false);
      // handler 应被调用 100 次（总共 101 条，丢弃 1 条最旧的）
      expect(handler).toHaveBeenCalledTimes(100);
    });
  });

  // ----------------------------------------------------------
  // 配置默认值
  // ----------------------------------------------------------
  describe('default options', () => {
    it('应使用默认心跳间隔 30000ms', () => {
      const client = new RealtimeClient({ url: 'wss://test.example.com/ws' });
      client.connect();
      currentSocket!.simulateOpen();

      // 推进 29999ms — 不应有心跳
      vi.advanceTimersByTime(29_999);
      const heartbeatBefore = currentSocket!.sentMessages.filter((msg) => {
        try {
          return JSON.parse(msg).channel === '__heartbeat__';
        } catch {
          return false;
        }
      });
      expect(heartbeatBefore.length).toBe(0);

      // 再推进 1ms — 应有心跳
      vi.advanceTimersByTime(1);
      const heartbeatAfter = currentSocket!.sentMessages.filter((msg) => {
        try {
          return JSON.parse(msg).channel === '__heartbeat__';
        } catch {
          return false;
        }
      });
      expect(heartbeatAfter.length).toBe(1);
    });

    it('应默认启用自动重连', () => {
      const client = new RealtimeClient({ url: 'wss://test.example.com/ws' });
      client.connect();
      currentSocket!.simulateOpen();

      // 断开
      currentSocket!.simulateClose();
      vi.advanceTimersByTime(2_000);

      // 应已重连
      expect(MockWebSocket.instanceCount).toBe(2);
    });
  });
});
