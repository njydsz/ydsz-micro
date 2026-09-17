/**
 * useNotificationHub composable 测试 —— 通知中心状态机。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-notification-hub.test.ts
 * @author ydsz-team
 * @since 5.6.0
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useNotificationHub } from './use-notification-hub';

describe('useNotificationHub', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('应推送通知并自增 unreadCount', () => {
    const hub = useNotificationHub();
    expect(hub.unreadCount.value).toBe(0);
    hub.push({ level: 'info', title: '测试通知' });
    expect(hub.unreadCount.value).toBe(1);
    expect(hub.items.value).toHaveLength(1);
  });

  it('标记已读应减少 unreadCount', () => {
    const hub = useNotificationHub();
    hub.push({ level: 'info', title: '测试通知' });
    const id = hub.items.value[0]?.id ?? '';
    expect(hub.unreadCount.value).toBe(1);
    hub.markAsRead(id);
    expect(hub.unreadCount.value).toBe(0);
  });

  it('markAllAsRead 应全部已读', () => {
    const hub = useNotificationHub();
    hub.push({ level: 'info', title: '通知 A' });
    hub.push({ level: 'info', title: '通知 B' });
    hub.markAllAsRead();
    expect(hub.unreadCount.value).toBe(0);
  });

  it('应正确移除通知', () => {
    const hub = useNotificationHub();
    hub.push({ level: 'info', title: '通知 A' });
    hub.push({ level: 'info', title: '通知 B' });
    const id = hub.items.value[0]?.id ?? '';
    hub.remove(id);
    expect(hub.items.value).toHaveLength(1);
  });

  it('clearAll 应清空所有通知', () => {
    const hub = useNotificationHub();
    hub.push({ level: 'info', title: '通知 A' });
    hub.push({ level: 'info', title: '通知 B' });
    hub.clearAll();
    expect(hub.items.value).toHaveLength(0);
  });

  it('maxVisible 应限制可见数量', () => {
    const hub = useNotificationHub({ preferences: { maxVisible: 2 } });
    hub.push({ level: 'info', title: '通知 A' });
    hub.push({ level: 'info', title: '通知 B' });
    hub.push({ level: 'info', title: '通知 C' });
    expect(hub.visibleItems.value).toHaveLength(2);
  });

  it('updatePreferences 应更新偏好设置', () => {
    const hub = useNotificationHub();
    hub.setPreferences({ maxVisible: 10 });
    expect(hub.preferences.value.maxVisible).toBe(10);
  });
});
