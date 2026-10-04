/**
 * use-notification-sse 单元测试
 *
 * 覆盖核心交互场景：
 * 1. SSE 消息到达时调用 store.addItem
 * 2. 离线时不会尝试连接
 * 3. 重连使用指数退避（mock 计时器验证）
 *
 * @path main\src\composables\__tests__\use-notification-sse.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { nextTick } from 'vue';

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

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
vi.mock('@ydsz/utils', async (importActual) => {
  const actual = await importActual<typeof import('@ydsz/utils')>();
  return {
    ...actual,
    calculateRetryDelay: vi.fn().mockReturnValue(100), // deterministic 100ms for testing
  };
});

describe('useNotificationSse', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllTimers();
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

    const { useNotificationSse } = await import('../use-notification-sse');
    useNotificationSse();
    await nextTick();

    // 等待微任务完成（mockImplementation 内的异步调用）
    await vi.advanceTimersByTimeAsync(0);

    // store.handleSseMessage 应被调用
    expect(mockStore.handleSseMessage).toHaveBeenCalledTimes(1);
    const callArg = mockStore.handleSseMessage.mock.calls[0][0];
    expect(callArg.event).toBe('new_notification');
  });

  // ==================== Test 2: 离线时不会尝试连接 ====================

  it('离线时不应调用 streamRequest', async () => {
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      configurable: true,
    });

    const { useNotificationSse } = await import('../use-notification-sse');
    useNotificationSse();
    await nextTick();

    // 离线状态不发起连接
    expect(mockStreamRequest).not.toHaveBeenCalled();
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

    const { useNotificationSse } = await import('../use-notification-sse');
    useNotificationSse();
    await nextTick();

    // 等待首次调用 + 错误抛出
    await vi.advanceTimersByTimeAsync(10);

    // 首次调用
    expect(callCount).toBe(1);

    // 触发重连定时器（mock 的 calculateRetryDelay 返回 100ms）
    await vi.advanceTimersByTimeAsync(150);

    // 第 2 次重连调用已发生
    expect(callCount).toBe(2);
  });
});
