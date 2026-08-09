/**
 * message-broker 模块单元测试
 *
 * 覆盖：
 * - 成功的请求-响应流程 (sendRequest + registerAppMessageHandler)
 * - 超时场景（响应未在超时时间内返回）
 * - 并发多个请求
 * - 错误响应处理（handler 抛出异常 / 异步 reject）
 * - 无效协议消息过滤（无 __MICRO_BROKER__ 标记的消息被忽略）
 * - dispose / 清理逻辑（clearPendingRequests + createMessageBrokerManager）
 *
 * 测试风格与 main 模块现有测试保持一致：
 * vi.mock('@YDSZ-core/shared/utils', ...) 模拟 logger。
 *
 * @path comm/effects/micro-kernel/src/__tests__/unit/message-broker.spec.ts
 * @author ydsz-team
 * @since 4.2.1
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * String(err) 对 Error 实例会输出 "Error: <message>"，
 * sendResponse 使用 String(err) 序列化异常。
 */
function errorField(expected: string) {
  return { error: `Error: ${expected}` };
}

// ============================================================
// Mock: @YDSZ-core/shared/utils — 消除 logger 控制台输出
// ============================================================
vi.mock('@YDSZ-core/shared/utils', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// ============================================================
// Import SUT (System Under Test)
// ============================================================
import {
  clearPendingRequests,
  createMessageBrokerManager,
  isBrokerMessage,
  registerAppMessageHandler,
  sendMessage,
  sendRequest,
  startMessageListener,
} from '../../message-broker';
import type { MicroMessage } from '../../message-broker';

// ============================================================
// Constants & helpers
// ============================================================
const MESSAGE_EVENT = 'micro-kernel:message';
const BROKER_MARK = '__MICRO_BROKER__';

/**
 * 构造并派发一个携带 __MICRO_BROKER__ 协议标记的 CustomEvent，
 * 模拟消息投递。
 */
function dispatchBrokerMessage(msg: Record<string, unknown>) {
  window.dispatchEvent(
    new CustomEvent(MESSAGE_EVENT, {
      detail: { [BROKER_MARK]: true, ...msg },
    }),
  );
}

// ============================================================
// Test suites
// ============================================================
describe('message-broker', () => {
  // 收集所有 startMessageListener 的清理函数，供 afterEach 统一释放
  const listenerCleanups: Array<() => void> = [];

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    clearPendingRequests();
    listenerCleanups.length = 0;
  });

  afterEach(() => {
    // 清理所有注册的 startMessageListener
    for (const cleanup of listenerCleanups) {
      cleanup();
    }
    listenerCleanups.length = 0;
    vi.useRealTimers();
  });

  /**
   * 辅助：启动消息监听（必须调用后 handler 才能被触发）
   * 清理函数会被自动收集到 afterEach 中释放。
   */
  function trackListener(cleanup: () => void) {
    listenerCleanups.push(cleanup);
    return cleanup;
  }

  // ----------------------------------------------------------
  // isBrokerMessage
  // ----------------------------------------------------------
  describe('isBrokerMessage', () => {
    it('应识别携带 __MICRO_BROKER__ 标记的对象', () => {
      expect(isBrokerMessage({ __MICRO_BROKER__: true })).toBe(true);
    });

    it('应拒绝无标记的普通对象', () => {
      expect(isBrokerMessage({ foo: 'bar' })).toBe(false);
    });

    it('应拒绝非对象 / null / 原始类型', () => {
      expect(isBrokerMessage(null)).toBe(false);
      expect(isBrokerMessage(undefined)).toBe(false);
      expect(isBrokerMessage('string')).toBe(false);
      expect(isBrokerMessage(42)).toBe(false);
    });
  });

  // ----------------------------------------------------------
  // sendMessage (fire-and-forget)
  // ----------------------------------------------------------
  describe('sendMessage', () => {
    it('应派发 CustomEvent 并返回 correlationId', () => {
      const spy = vi.spyOn(window, 'dispatchEvent');

      const id = sendMessage('userinfo-web', 'greet', { name: 'Alice' });

      expect(typeof id).toBe('string');
      expect(id).toContain('msg_');
      expect(spy).toHaveBeenCalledTimes(1);

      const event = spy.mock.calls[0][0] as CustomEvent;
      expect(event.type).toBe(MESSAGE_EVENT);
      expect(event.detail).toMatchObject({
        __MICRO_BROKER__: true,
        from: 'main',
        to: 'userinfo-web',
        action: 'greet',
        payload: { name: 'Alice' },
        correlationId: id,
      });

      spy.mockRestore();
    });
  });

  // ----------------------------------------------------------
  // registerAppMessageHandler — 注册与取消
  // ----------------------------------------------------------
  describe('registerAppMessageHandler', () => {
    it('应返回取消注册函数，调用后 handler 被移除', () => {
      const handler = vi.fn();
      const unregister = registerAppMessageHandler('test-app', handler);

      // 启动监听（handler 通过监听器触发）
      trackListener(startMessageListener());

      // 派发消息
      window.dispatchEvent(
        new CustomEvent(MESSAGE_EVENT, {
          detail: {
            __MICRO_BROKER__: true,
            from: 'main',
            to: 'test-app',
            action: 'ping',
            payload: null,
            correlationId: 'test-123',
          } as Partial<MicroMessage>,
        }),
      );

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test-app',
          action: 'ping',
          correlationId: 'test-123',
        }),
      );

      // 取消注册
      unregister();

      // 再次发送相同消息，handler 不应再被调用
      window.dispatchEvent(
        new CustomEvent(MESSAGE_EVENT, {
          detail: {
            __MICRO_BROKER__: true,
            from: 'main',
            to: 'test-app',
            action: 'ping',
            payload: null,
            correlationId: 'test-456',
          } as Partial<MicroMessage>,
        }),
      );

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('同一应用支持多个 handler，首个返回非 undefined 的生效', () => {
      const results: string[] = [];
      const h1 = vi.fn(() => {
        results.push('h1');
        return undefined; // 返回 undefined 继续尝试下一个 handler
      });
      const h2 = vi.fn(() => {
        results.push('h2');
        return 'from-h2';
      });

      registerAppMessageHandler('multi-handler-app', h1);
      registerAppMessageHandler('multi-handler-app', h2);

      // 只注册一个 startMessageListener，避免重复触发
      trackListener(startMessageListener());

      sendRequest('multi-handler-app', 'ask', null, 5_000);

      // 两个 handler 都被遍历了
      expect(results).toEqual(['h1', 'h2']);
    });
  });

  // ----------------------------------------------------------
  // sendRequest — 成功的请求-响应
  // ----------------------------------------------------------
  describe('sendRequest - success', () => {
    it('应 resolve 并返回 handler 同步响应数据', async () => {
      registerAppMessageHandler('echo-app', (msg: MicroMessage) => {
        return { echoed: msg.payload };
      });

      trackListener(startMessageListener());

      const promise = sendRequest('echo-app', 'ping', 'hello', 5_000);

      // 推进微任务让响应处理完成
      await vi.advanceTimersByTimeAsync(0);

      await expect(promise).resolves.toEqual({ echoed: 'hello' });
    });

    it('应支持异步 handler（返回 Promise）', async () => {
      registerAppMessageHandler('async-app', async (msg: MicroMessage) => {
        await new Promise((r) => setTimeout(r, 10));
        return { async: true, payload: msg.payload };
      });

      trackListener(startMessageListener());

      const promise = sendRequest('async-app', 'fetch', { id: 1 }, 5_000);

      // 推进定时器让异步 handler 完成并返回响应
      await vi.advanceTimersByTimeAsync(50);

      await expect(promise).resolves.toEqual({ async: true, payload: { id: 1 } });
    });
  });

  // ----------------------------------------------------------
  // sendRequest — 超时场景
  // ----------------------------------------------------------
  describe('sendRequest - timeout', () => {
    it('应在超时时 reject 并携带描述性错误', async () => {
      trackListener(startMessageListener());

      const promise = sendRequest('no-response-app', 'timeout-test', null, 3_000);

      await vi.advanceTimersByTimeAsync(3_500);

      await expect(promise).rejects.toThrow(
        'Request timeout: no-response-app/timeout-test',
      );
    });

    it('使用默认超时 (10s) 当未指定 timeout', async () => {
      trackListener(startMessageListener());

      const promise = sendRequest('slow-app', 'slow-action');

      // 推进 9999ms — 尚未超时
      vi.advanceTimersByTime(9_999);
      // 推进至超出 10000ms
      await vi.advanceTimersByTimeAsync(2);

      await expect(promise).rejects.toThrow(/Request timeout/);
    });
  });

  // ----------------------------------------------------------
  // sendRequest — 并发多个请求
  // ----------------------------------------------------------
  describe('sendRequest - concurrent requests', () => {
    it('应正确并发处理多个请求，各自独立 resolve', async () => {
      registerAppMessageHandler('concurrency-app', async (msg: MicroMessage) => {
        const delay = (msg.payload as { delay: number }).delay;
        await new Promise((r) => setTimeout(r, delay));
        return { done: true, delay };
      });

      trackListener(startMessageListener());

      const p1 = sendRequest('concurrency-app', 'task', { delay: 50 }, 10_000);
      const p2 = sendRequest('concurrency-app', 'task', { delay: 100 }, 10_000);
      const p3 = sendRequest('concurrency-app', 'task', { delay: 30 }, 10_000);

      await vi.advanceTimersByTimeAsync(200);

      const results = await Promise.all([p1, p2, p3]);
      expect(results).toEqual([
        { done: true, delay: 50 },
        { done: true, delay: 100 },
        { done: true, delay: 30 },
      ]);
    });

    it('并发请求中一个超时不影响其他 resolve', async () => {
      registerAppMessageHandler('mixed-app', (msg: MicroMessage) => {
        if (msg.action === 'will-timeout') {
          // 不返回 → 不会触发 sendResponse → 请求自然超时
          return undefined;
        }
        return { responded: true };
      });

      trackListener(startMessageListener());

      const p1 = sendRequest('mixed-app', 'quick', null, 5_000);
      // p2 会超时 — 捕获防止 unhandled rejection
      const p2 = sendRequest('mixed-app', 'will-timeout', null, 2_000).catch(
        (err) => err,
      );

      await vi.advanceTimersByTimeAsync(3_000);

      const r1 = await p1;
      const r2 = await p2;

      expect(r1).toEqual({ responded: true });
      expect(r2).toBeInstanceOf(Error);
      expect((r2 as Error).message).toContain('Request timeout');
    });
  });

  // ----------------------------------------------------------
  // 错误响应处理
  // ----------------------------------------------------------
  describe('error handling', () => {
    it('handler 同步抛出异常时，响应包含 error 字段', async () => {
      registerAppMessageHandler('throw-app', () => {
        throw new Error('boom');
      });

      trackListener(startMessageListener());

      const promise = sendRequest('throw-app', 'fail', null, 5_000);

      await vi.advanceTimersByTimeAsync(0);

      await expect(promise).resolves.toEqual(errorField('boom'));
    });

    it('异步 handler reject 时，响应包含 error 字段', async () => {
      registerAppMessageHandler('reject-app', async () => {
        throw new Error('async-reject');
      });

      trackListener(startMessageListener());

      const promise = sendRequest('reject-app', 'reject-me', null, 5_000);

      await vi.advanceTimersByTimeAsync(50);

      await expect(promise).resolves.toEqual(errorField('async-reject'));
    });
  });

  // ----------------------------------------------------------
  // 无效协议消息过滤
  // ----------------------------------------------------------
  describe('protocol filtering', () => {
    it('应忽略无 __MICRO_BROKER__ 标记的消息', () => {
      const handler = vi.fn();
      registerAppMessageHandler('secure-app', handler);

      trackListener(startMessageListener());

      window.dispatchEvent(
        new CustomEvent(MESSAGE_EVENT, {
          detail: {
            from: 'main',
            to: 'secure-app',
            action: 'hacked',
            payload: 'malicious',
            correlationId: 'evil-001',
          } as unknown as MicroMessage,
        }),
      );

      expect(handler).not.toHaveBeenCalled();
    });

    it('应忽略 detail 为 null 的消息', () => {
      const handler = vi.fn();
      registerAppMessageHandler('safe-app', handler);

      trackListener(startMessageListener());

      window.dispatchEvent(new CustomEvent(MESSAGE_EVENT, { detail: null }));

      expect(handler).not.toHaveBeenCalled();
    });

    it('应忽略 detail 为原始类型的消息', () => {
      const handler = vi.fn();
      registerAppMessageHandler('safe-app2', handler);

      trackListener(startMessageListener());

      window.dispatchEvent(
        new CustomEvent(MESSAGE_EVENT, { detail: 'string-value' }),
      );

      expect(handler).not.toHaveBeenCalled();
    });

    it('startMessageListener 的 onRequest 回调应接收有效 broker 消息', () => {
      const onRequest = vi.fn();
      trackListener(startMessageListener(onRequest));

      dispatchBrokerMessage({
        from: 'main',
        to: 'app1',
        action: 'test',
        payload: 1,
        correlationId: 'cid-1',
      });

      expect(onRequest).toHaveBeenCalledTimes(1);
      expect(onRequest).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'test', correlationId: 'cid-1' }),
      );
    });
  });

  // ----------------------------------------------------------
  // dispose / 清理逻辑
  // ----------------------------------------------------------
  describe('dispose / cleanup', () => {
    it('clearPendingRequests 应清除所有 pending 请求并 reject Promise', async () => {
      trackListener(startMessageListener());

      const p1 = sendRequest('pending-app-1', 'action1', null, 10_000);
      const p2 = sendRequest('pending-app-2', 'action2', null, 10_000);

      clearPendingRequests();

      await expect(p1).rejects.toThrow('Message broker cleared');
      await expect(p2).rejects.toThrow('Message broker cleared');
    });

    it('clearPendingRequests 应清除已注册的 handlers', () => {
      const handler = vi.fn(() => 'ok');
      registerAppMessageHandler('cleanup-app', handler);

      trackListener(startMessageListener());
      clearPendingRequests();

      // handlers 已清空，派发消息不应触发 handler
      window.dispatchEvent(
        new CustomEvent(MESSAGE_EVENT, {
          detail: {
            __MICRO_BROKER__: true,
            from: 'main',
            to: 'cleanup-app',
            action: 'should-not-reach',
            payload: null,
            correlationId: 'after-clear',
          },
        }),
      );

      expect(handler).not.toHaveBeenCalled();
    });

    it('createMessageBrokerManager dispose 应清理 handlers 与 pending 请求', async () => {
      const manager = createMessageBrokerManager();
      expect(manager.name).toBe('message-broker');

      // 使用不返回值的 handler — 请求保持 pending 状态
      const handler = vi.fn(() => undefined);
      registerAppMessageHandler('mgr-app', handler);

      trackListener(startMessageListener());

      // 发送请求：handler 返回 undefined → sendResponse 不会被调用 → 请求保持 pending
      const p = sendRequest('mgr-app', 'action', null, 10_000);

      // sendRequest 已触发一次 handler（返回 undefined）
      expect(handler).toHaveBeenCalledTimes(1);

      // dispose 应 reject 尚未完成的请求
      manager.dispose();

      await expect(p).rejects.toThrow('Message broker cleared');

      // dispose 后 handlers map 已清空 — 派发新消息不应触发 handler
      window.dispatchEvent(
        new CustomEvent(MESSAGE_EVENT, {
          detail: {
            __MICRO_BROKER__: true,
            from: 'main',
            to: 'mgr-app',
            action: 'after-dispose',
            payload: null,
            correlationId: 'mgr-after',
          },
        }),
      );

      // handler 调用次数不变（第二次 dispatch 未触发）
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('重复调用 clearPendingRequests 不报错', () => {
      trackListener(startMessageListener());
      sendRequest('idempotent-app', 'a', null, 10_000);
      clearPendingRequests();
      expect(() => clearPendingRequests()).not.toThrow();
    });
  });
});
