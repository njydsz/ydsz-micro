/**
 * createNotificationCore 共享核心单元测试
 *
 * <p>用例覆盖：
 * - 核心 state 初始化正确
 * - API 调用成功时 state 更新正确
 * - API 调用失败时静默降级（不抛异常）
 * - markRead 乐观更新（本地状态先于 API 响应更新）
 *
 * @path comm\stores\src\modules\notification-core.test.ts
 * @author ydsz-team
 * @since 26.10.02
 */

import { describe, expect, it, vi } from 'vitest';

import {
  createNotificationCore,
  type NotificationCoreApis,
  type NotificationItem,
} from './notification-core';

/** mock API 工厂 —— 提供可断言的成功/失败行为 */
function createMockApis(overrides?: Partial<NotificationCoreApis>): NotificationCoreApis {
  return {
    getNotificationsApi: vi.fn().mockResolvedValue({
      items: [
        { id: '1', title: 't1', message: 'm1', type: 'INFO', isRead: false, createdAt: '2026-01-01' },
      ],
    }),
    getUnreadCountApi: vi.fn().mockResolvedValue(5),
    markAsReadApi: vi.fn().mockResolvedValue(undefined),
    markAllAsReadApi: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('createNotificationCore', () => {
  it('初始 state 为空列表与零未读数', () => {
    const core = createNotificationCore(createMockApis());
    expect(core.notifications.value).toEqual([]);
    expect(core.unreadCount.value).toBe(0);
  });

  it('loadNotifications 成功后更新列表', async () => {
    const apis = createMockApis();
    const core = createNotificationCore(apis);

    await core.loadNotifications(1, 20);

    expect(apis.getNotificationsApi).toHaveBeenCalledWith({ pageNum: 1, pageSize: 20 });
    expect(core.notifications.value).toHaveLength(1);
    expect(core.notifications.value[0].id).toBe('1');
  });

  it('loadNotifications 失败时静默降级（不抛异常）', async () => {
    const apis = createMockApis({
      getNotificationsApi: vi.fn().mockRejectedValue(new Error('Network Error')),
    });
    const core = createNotificationCore(apis);

    // 不应抛出异常
    await expect(core.loadNotifications()).resolves.toBeUndefined();
    // 列表保持初始状态
    expect(core.notifications.value).toEqual([]);
  });

  it('refreshUnreadCount 成功后更新未读数', async () => {
    const core = createNotificationCore(createMockApis());
    await core.refreshUnreadCount();
    expect(core.unreadCount.value).toBe(5);
  });

  it('markRead 成功后更新本地已读状态并递减未读计数', async () => {
    const apis = createMockApis();
    const core = createNotificationCore(apis);

    // 先加载数据
    await core.loadNotifications();
    await core.refreshUnreadCount();
    expect(core.unreadCount.value).toBe(5);

    // 标记第一条已读
    await core.markRead('1');

    const item = core.notifications.value.find((n: NotificationItem) => n.id === '1');
    expect(item?.isRead).toBe(true);
    // 未读计数从 5 递讲到 4（注意：真实场景中 refreshUnreadCount 应由 API 结果决定）
    expect(core.unreadCount.value).toBe(4);
  });

  it('markAllRead 后将所有通知改为已读且未读计数归零', async () => {
    const apis = createMockApis({
      getNotificationsApi: vi.fn().mockResolvedValue({
        items: [
          { id: '1', title: 't1', message: 'm1', type: 'INFO', isRead: false, createdAt: '2026-01-01' },
          { id: '2', title: 't2', message: 'm2', type: 'WARN', isRead: false, createdAt: '2026-01-02' },
        ],
      }),
    });
    const core = createNotificationCore(apis);

    await core.loadNotifications();
    await core.markAllRead();

    expect(core.notifications.value.every((n: NotificationItem) => n.isRead)).toBe(true);
    expect(core.unreadCount.value).toBe(0);
  });
});
