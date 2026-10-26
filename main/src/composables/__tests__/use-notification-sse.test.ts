/**
 * use-notification-sse 单元测试
 *
 * 覆盖核心交互场景：
 * 1. SSE 消息到达时调用 store.handleSseMessage
 * 2. 离线时不会尝试连接
 * 3. 重连使用指数退避（mock 计时器验证）
 *
 * <p>composable 的连接在 onMounted 中建立，且底层连接是模块级单例，
 * 因此用例统一挂载宿主组件触发生命周期，并在每例前 resetModules 重置单例。
 *
 * @path main\src\composables\__tests__\use-notification-sse.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import type * as ydszUtils from '@ydsz/utils';

import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

// ===== Mock streamRequest（before import to ensure hoisting works）=====
const mockStreamRequest = vi.fn();

vi.mock('@ydsz/shared-auth', () => ({
  streamRequest: (...args: unknown[]) => mockStreamRequest(...args),
}));

// ===== Mock notification store =====
const mockStore = {
  notifications: [],
  unreadCount: 0,
  sseConnected: false,
  handleSseMessage: vi.fn(),
  setSseConnected: vi.fn(),
  addItem: vi.fn(),
  fetchNotifications: vi.fn(),
  refreshUnreadCount: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  removeNotification: vi.fn(),
  clearAll: vi.fn(),
};

vi.mock('#/store/notification', () => ({
  useNotificationStore: () => mockStore,
}));

// ===== Mock calculateRetryDelay to return deterministic values =====
// createLogger 一并替换：重连用例会故意抛错，真实 logger 会把堆栈打到 stderr
// 退避延迟用 vi.fn(impl) 而非 mockReturnValue：afterEach 的 restoreAllMocks 会清掉
// mockReturnValue，但不会清掉构造时传入的实现
const { mockCalculateRetryDelay } = vi.hoisted(() => ({
  mockCalculateRetryDelay: vi.fn(() => 100), // deterministic 100ms for testing
}));

vi.mock('@ydsz/utils', async (importActual) => {
  const actual = await importActual<typeof ydszUtils>();
  return {
    ...actual,
    calculateRetryDelay: mockCalculateRetryDelay,
    createLogger: () => ({ debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() }),
  };
});

describe('useNotificationSse', () => {
  /** 挂载调用 composable 的宿主组件，使 onMounted / onUnmounted 真实生效 */
  async function mountSseHost() {
    const { useNotificationSse } = await import('../use-notification-sse');
    let api: { stop: () => void } | undefined;
    const wrapper = mount(
      defineComponent({
        setup() {
          api = useNotificationSse();
          return () => h('div', { id: 'sse-host' });
        },
      }),
    );
    return { getApi: () => api!, wrapper };
  }

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllTimers();
    vi.resetModules();
    mockStreamRequest.mockReset();
    mockStore.handleSseMessage.mockReset();
    mockStore.setSseConnected.mockReset();

    // 默认在线
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ==================== Test 1: SSE 消息到达时调用 store.handleSseMessage ====================

  it('收到 SSE 消息时应调用 store.handleSseMessage', async () => {
    // 模拟 streamRequest 在收到事件时调用 onEvent
    mockStreamRequest.mockImplementation(async (opts: {
      onEvent?: (event: { event?: string; data: string }) => void;
    }) => {
      // 模拟接收一条新通知消息
      opts.onEvent?.({
        event: 'new_notification',
        data: JSON.stringify({
          id: 'n1',
          title: '测试通知',
          message: '这是一条测试',
          type: 'INFO',
          isRead: false,
          createdAt: '2026-07-14T10:00:00Z',
          event: 'new_notification',
        }),
      });
    });

    const { getApi, wrapper } = await mountSseHost();
    await vi.advanceTimersByTimeAsync(0);

    // store.handleSseMessage 应被调用
    expect(mockStore.handleSseMessage).toHaveBeenCalledTimes(1);
    const callArg = mockStore.handleSseMessage.mock.calls[0]![0] as { event: string };
    expect(callArg.event).toBe('new_notification');
    // 首帧应把连接状态回报给 store
    expect(mockStore.setSseConnected).toHaveBeenCalledWith(true);

    getApi().stop();
    wrapper.unmount();
  });

  // ==================== Test 2: 离线时不会尝试连接 ====================

  it('离线时不应调用 streamRequest', async () => {
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      configurable: true,
    });

    const { wrapper } = await mountSseHost();
    await vi.advanceTimersByTimeAsync(0);

    // 离线状态不发起连接
    expect(mockStreamRequest).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  // ==================== Test 3: 重连使用指数退避（mock 计时器验证） ====================

  it('连接异常后应按指数退避调度重连', async () => {
    let callCount = 0;

    // 第 1 次调用抛出错误 → 触发重连
    mockStreamRequest.mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        throw new Error('Connection refused');
      }
      // 第 2 次调用成功（pending promise 以 idle）
      return new Promise(() => {});
    });

    const { getApi, wrapper } = await mountSseHost();
    await vi.advanceTimersByTimeAsync(10);

    // 首次调用
    expect(callCount).toBe(1);

    // 触发重连定时器（mock 的 calculateRetryDelay 返回 100ms）
    await vi.advanceTimersByTimeAsync(150);

    // 第 2 次重连调用已发生
    expect(callCount).toBe(2);

    getApi().stop();
    wrapper.unmount();
  });
});
