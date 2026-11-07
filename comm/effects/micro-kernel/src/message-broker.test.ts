/**
 * 内核消息总线测试
 *
 * 覆盖协议标记防冲突、监听器幂等、定向投递、请求-响应关联、超时语义、
 * 多 handler 分发顺序。
 *
 * message-broker 是函数式 API（非 class 单例）：
 * - registerAppMessageHandler 注册 handler，返回注销函数
 * - sendMessage / sendRequest 发送
 * - startMessageListener 启动窗口监听（v4.3.2 起真正幂等）
 *
 * @path comm\effects\micro-kernel\src\message-broker.test.ts
 * @author ydsz-team
 * @since 26.11.07
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  clearPendingRequests,
  isBrokerMessage,
  registerAppMessageHandler,
  sendMessage,
  sendRequest,
  startMessageListener,
  type MicroMessage,
} from './message-broker';

/** 内核消息总线事件名（模块内私有常量，此处镜像用于断言） */
const MESSAGE_EVENT = 'micro-kernel:message';
/** 统一协议标记键（模块内私有常量，此处镜像用于断言） */
const BROKER_MARK = '__MICRO_BROKER__';

describe('message-broker', () => {
  /** 收集注销函数与停止函数，afterEach 统一调用避免模块级状态串扰 */
  const cleanups: Array<() => void> = [];

  afterEach(() => {
    while (cleanups.length > 0) cleanups.pop()!();
    clearPendingRequests();
  });

  function start(): void {
    cleanups.push(startMessageListener());
  }

  function register(app: string, handler: (m: MicroMessage) => unknown): void {
    cleanups.push(registerAppMessageHandler(app, handler));
  }

  describe('协议标记与校验', () => {
    it('协议标记键以下划线包裹，避免与业务字段冲突', () => {
      expect(BROKER_MARK).toMatch(/^__.*__$/);
    });

    it('isBrokerMessage 只接受带协议标记的负载', () => {
      expect(isBrokerMessage({ [BROKER_MARK]: true, type: 't' })).toBe(true);
      expect(isBrokerMessage({ type: 't' })).toBe(false);
      expect(isBrokerMessage(null)).toBe(false);
      expect(isBrokerMessage('string')).toBe(false);
    });
  });

  describe('监听器幂等（v4.3.2 修复点）', () => {
    it('重复启动仍只投递一次', () => {
      start();
      start();
      const handler = vi.fn();
      register('sub-a', handler);

      sendMessage('sub-a', 'ping');

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('停止后再次启动可重新投递', () => {
      start();
      const stop = cleanups.pop()!;
      stop();

      const handler = vi.fn();
      register('sub-a', handler);
      sendMessage('sub-a', 'ping');
      expect(handler).not.toHaveBeenCalled();

      // 重新启动
      start();
      sendMessage('sub-a', 'ping');
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('投递语义', () => {
    it('定向消息只投递给目标应用', () => {
      start();
      const targetHandler = vi.fn();
      const otherHandler = vi.fn();
      register('sub-a', targetHandler);
      register('sub-b', otherHandler);

      sendMessage('sub-a', 'ping', { n: 1 });

      expect(targetHandler).toHaveBeenCalledTimes(1);
      expect(otherHandler).not.toHaveBeenCalled();
    });

    it('未注册的应用不收到定向消息', () => {
      start();
      const handler = vi.fn();
      register('sub-a', handler);

      sendMessage('sub-unknown', 'ping');

      expect(handler).not.toHaveBeenCalled();
    });

    it('重复注册同一 handler 覆盖（Set 语义：同一函数只保留一份）', () => {
      start();
      const handler = vi.fn();
      register('sub-a', handler);
      register('sub-a', handler);

      sendMessage('sub-a', 'ping');

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('消息携带协议标记，可与其他 CustomEvent 区分', () => {
      const listener = vi.fn();
      window.addEventListener(MESSAGE_EVENT, listener);

      sendMessage('sub-a', 'ping');
      cleanups.push(() => window.removeEventListener(MESSAGE_EVENT, listener));

      expect(listener).toHaveBeenCalledTimes(1);
      const event = listener.mock.calls[0]![0] as CustomEvent<MicroMessage>;
      expect((event.detail as unknown as Record<string, unknown>)[BROKER_MARK]).toBe(true);
    });
  });

  describe('请求-响应', () => {
    it('sendRequest resolve 的是响应负载而非完整消息', async () => {
      start();
      register('sub-a', (msg) => ({ echoed: msg.payload }));

      await expect(sendRequest('sub-a', 'ping', { n: 1 }, 1000)).resolves.toEqual({
        echoed: { n: 1 },
      });
    });

    it('sendRequest 无 handler 时超时 reject', async () => {
      start();

      await expect(sendRequest('nobody', 'ping', null, 50)).rejects.toThrow(
        /Request timeout/,
      );
    });

    it('并发请求各自拿到自己的响应，不串扰', async () => {
      start();
      // handler 回显 payload，两个请求用不同 payload 区分
      register('sub-a', (msg) => msg.payload);

      const [resA, resB] = await Promise.all([
        sendRequest('sub-a', 'a', 'payload-A', 1000),
        sendRequest('sub-a', 'b', 'payload-B', 1000),
      ]);

      expect(resA).toBe('payload-A');
      expect(resB).toBe('payload-B');
    });

    it('handler 返回 undefined 时视为无响应，超时 reject', async () => {
      start();
      register('sub-a', () => undefined);

      await expect(sendRequest('sub-a', 'ping', null, 50)).rejects.toThrow(
        /Request timeout/,
      );
    });
  });

  describe('多 handler 语义', () => {
    it('handler 抛错不影响总线（错误被捕获并回发 error 响应）', () => {
      start();
      register('sub-a', () => {
        throw new Error('handler boom');
      });

      expect(() => sendMessage('sub-a', 'ping')).not.toThrow();
    });

    it('首个返回非 undefined 的 handler 生效，后续不再响应', async () => {
      start();
      register('sub-a', () => undefined);
      register('sub-a', () => 'first');
      register('sub-a', () => 'second');

      await expect(sendRequest('sub-a', 'ping', null, 1000)).resolves.toBe('first');
    });
  });

  describe('clearPendingRequests', () => {
    it('清理后待响应请求以 reject 收场', async () => {
      start();

      const promise = sendRequest('nobody', 'ping', null, 10_000);
      const assertion = expect(promise).rejects.toThrow(/broker cleared/);
      clearPendingRequests();
      await assertion;
    });
  });
});
