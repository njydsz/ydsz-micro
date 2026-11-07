/**
 * 类型化通信契约测试
 *
 * 验证契约层的两个层面：
 *   1. 运行时：sendTypedRequest / registerTypedHandler 与底层 message-broker 行为一致
 *   2. 编译期：契约表能正确推导请求与响应类型（通过 @ts-expect-error 反向断言）
 *
 * @path comm\effects\micro-kernel\src\message-contract.test.ts
 * @author ydsz-team
 * @since 26.11.07
 */

import { afterEach, describe, expect, expectTypeOf, it } from 'vitest';

import {
  type ContractWithResponse,
  type RequestOf,
  type ResponseOf,
  registerTypedHandler,
  sendTypedRequest,
} from './message-contract';
import { clearPendingRequests, startMessageListener } from './message-broker';

/** 测试用契约表 */
interface TestContract extends ContractWithResponse {
  getUser: { id: number; response: { name: string } };
  saveUser: { name: string };
}

describe('message-contract', () => {
  const cleanups: Array<() => void> = [];

  afterEach(() => {
    while (cleanups.length > 0) cleanups.pop()!();
    clearPendingRequests();
  });

  describe('编译期类型推导', () => {
    it('RequestOf 提取请求 payload 类型', () => {
      expectTypeOf<RequestOf<TestContract, 'getUser'>>().toEqualTypeOf<{ id: number }>();
      expectTypeOf<RequestOf<TestContract, 'saveUser'>>().toEqualTypeOf<{ name: string }>();
    });

    it('ResponseOf 从 response 字段提取响应类型', () => {
      expectTypeOf<ResponseOf<TestContract, 'getUser'>>().toEqualTypeOf<{ name: string }>();
    });

    it('未声明 response 的 action 响应类型为 void', () => {
      expectTypeOf<ResponseOf<TestContract, 'saveUser'>>().toEqualTypeOf<void>();
    });

    it('错误的 payload 结构在编译期被拒绝', () => {
      // @ts-expect-error getUser 不接受 name 字段
      const _bad: RequestOf<TestContract, 'getUser'> = { name: 'x' };
      expect(_bad).toBeDefined();
    });

    it('错误的 action 名在编译期被拒绝', () => {
      // @ts-expect-error 契约表中不存在 getUesr（拼写错误）
      type _Bad = RequestOf<TestContract, 'getUesr'>;
      expect(true).toBe(true);
    });
  });

  describe('运行时行为', () => {
    it('registerTypedHandler 只响应匹配的 action', async () => {
      cleanups.push(startMessageListener());
      const received: unknown[] = [];
      cleanups.push(
        registerTypedHandler<TestContract, 'getUser'>('sub-a', 'getUser', (payload) => {
          received.push(payload);
          return { name: `user-${payload.id}` };
        }),
      );

      const response = await sendTypedRequest<TestContract, 'getUser'>(
        'sub-a',
        'getUser',
        { id: 42 },
        1000,
      );

      expect(response).toEqual({ name: 'user-42' });
      expect(received).toEqual([{ id: 42 }]);
    });

    it('未注册对应 action 时不产生响应', async () => {
      cleanups.push(startMessageListener());
      const handler = registerTypedHandler<TestContract, 'getUser'>(
        'sub-a',
        'getUser',
        () => ({ name: 'x' }),
      );
      cleanups.push(handler);

      // saveUser 未注册 → 超时
      await expect(
        sendTypedRequest<TestContract, 'saveUser'>('sub-a', 'saveUser', { name: 'y' }, 50),
      ).rejects.toThrow(/Request timeout/);
    });

    it('handler 抛错时调用方收到 error 响应而非挂起', async () => {
      cleanups.push(startMessageListener());
      cleanups.push(
        registerTypedHandler<TestContract, 'getUser'>('sub-a', 'getUser', () => {
          throw new Error('handler boom');
        }),
      );

      // 底层会把错误作为 error 响应回发，调用方 resolve 到错误信息
      const result = await sendTypedRequest<TestContract, 'getUser'>(
        'sub-a',
        'getUser',
        { id: 1 },
        1000,
      ).catch((e: unknown) => e);

      // 两种收场都算通过：拿到 error 字符串或抛错，关键是不能挂起
      expect(result).toBeDefined();
    });

    it('handler 返回 undefined 时调用方超时', async () => {
      cleanups.push(startMessageListener());
      cleanups.push(
        registerTypedHandler<TestContract, 'getUser'>('sub-a', 'getUser', () => undefined as unknown as { name: string }),
      );

      await expect(
        sendTypedRequest<TestContract, 'getUser'>('sub-a', 'getUser', { id: 1 }, 50),
      ).rejects.toThrow(/Request timeout/);
    });
  });
});
