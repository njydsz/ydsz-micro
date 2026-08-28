/**
 * sse-lifecycle 单元测试 — openSseRequest 生命周期骨架
 *
 * 对 ./sse 的 streamRequest 打桩，覆盖：
 * - 首帧触发 onOpen，且仅触发一次
 * - 正常收尾触发 onClose；异常触发 onError
 * - 外部 AbortSignal 取消时不触发 onClose/onError
 * - 关闭函数幂等
 *
 * @path comm/effects/shared-auth/src/__tests__/sse-lifecycle.test.ts
 * @author ydsz-team
 * @since 4.4.0
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { openSseRequest, safeParseSseJson } from '../sse-lifecycle';

// 打桩 streamRequest：记录调用参数，行为由各用例注入
const streamRequestMock = vi.hoisted(() => vi.fn());
vi.mock('../sse', () => ({
  streamRequest: (...args: unknown[]) => streamRequestMock(...args),
}));

describe('openSseRequest', () => {
  beforeEach(() => {
    streamRequestMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('首帧触发 onOpen 且仅一次，事件正确分发', async () => {
    const onOpen = vi.fn();
    const onEvent = vi.fn();
    streamRequestMock.mockImplementation(async ({ onEvent: sink }) => {
      sink?.({ event: 'chunk', data: '{"content":"hi"}' });
      sink?.({ event: undefined, data: '' });
      sink?.({ event: 'chunk', data: '{"content":"!"}' });
    });

    openSseRequest({ url: '/api/v1/x/stream', onOpen, onEvent });
    await vi.waitFor(() => expect(onEvent).toHaveBeenCalledTimes(3));

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onEvent).toHaveBeenNthCalledWith(1, 'chunk', { content: 'hi' });
    expect(onEvent).toHaveBeenNthCalledWith(2, 'message', null);
    expect(onEvent).toHaveBeenNthCalledWith(3, 'chunk', { content: '!' });
  });

  it('正常收尾触发 onClose，且返回的关闭函数幂等', async () => {
    const onClose = vi.fn();
    streamRequestMock.mockResolvedValue(undefined);

    const close = openSseRequest({ url: '/api/v1/x/stream', onClose });
    await vi.waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));

    close();
    close();
    expect(onClose).toHaveBeenCalledTimes(1); // 幂等收尾，不重复触发
  });

  it('外部 AbortSignal 取消时不触发 onClose/onError', async () => {
    const onClose = vi.fn();
    const onError = vi.fn();
    const controller = new AbortController();
    streamRequestMock.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          controller.signal.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          );
        }),
    );

    const close = openSseRequest({
      url: '/api/v1/x/stream',
      signal: controller.signal,
      onClose,
      onError,
    });

    close();
    await new Promise((r) => setTimeout(r, 20));

    expect(onClose).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it('流内异常触发 onError，且不触发 onClose', async () => {
    const onClose = vi.fn();
    const onError = vi.fn();
    streamRequestMock.mockRejectedValue(new Error('network down'));

    openSseRequest({ url: '/api/v1/x/stream', onClose, onError });
    await vi.waitFor(() => expect(onError).toHaveBeenCalledTimes(1));

    expect(onError.mock.calls[0]?.[0]).toBeInstanceOf(Error);
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('safeParseSseJson', () => {
  it('合法 JSON 对象返回解析结果，非法输入返回 null', () => {
    expect(safeParseSseJson('{"a":1}')).toEqual({ a: 1 });
    expect(safeParseSseJson('not-json')).toBeNull();
    expect(safeParseSseJson('null')).toBeNull();
    // 数组为合法 JSON，按原两份副本行为原样透传（业务侧按对象取字段自然忽略）
    expect(safeParseSseJson('[1,2]')).toEqual([1, 2]);
  });
});
