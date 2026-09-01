/**
 * 通知中心 Pinia Store —— 跨模块未读计数 + 通知列表管理。
 *
 * <p>设计：
 * <ul>
 *   <li>各子系统（workflow / message / system / audit）各自 dispatch {@link pushNotification}
 *       到本 store 维持单一数据源</li>
 *   <li>未读计数由各子系统独立 HTTP 拉取 + SSE 增量更新</li>
 *   <li>聚合后的「总数」通过 {@link totalUnread} computed 派生，驱动顶部铃铛 badge</li>
 * </ul>
 *
 * <p>SSE 扩展整合：{@link setupSseNotificationBridge} 启动 SSE 长连接后，
 * 将不同类型事件分派到对应 handler，列表自动 Insert 前端。
 *
 * @path comm/effects/shared-business/src/notification/notification-store.ts
 * @author ydsz-team
 * @since 4.1.0 (P2-15)
 */

import { defineStore } from 'pinia';

import { computed, ref } from 'vue';

import type { NotificationItem, NotificationUnreadCounts, NotificationType } from './notification-types';

/** 通知列表容量上限（超长截断，保持内存可控） */
const MAX_NOTIFICATION_ITEMS = 200;

/** 初始未读数全零 */
const INITIAL_COUNTS: NotificationUnreadCounts = {
  system: 0,
  workflow: 0,
  message: 0,
  audit: 0,
  total: 0,
};

export const useNotificationStore = defineStore('notification', () => {
  // =====================================================================
  // State
  // =====================================================================

  /** 通知列表（新 → 旧排列） */
  const items = ref<NotificationItem[]>([]);

  /** 各类型未读计数 */
  const unreadCounts = ref<NotificationUnreadCounts>({ ...INITIAL_COUNTS });

  /** 当前筛选类型（null 表示「全部」） */
  const activeFilter = ref<NotificationType | null>(null);

  /** SSE 通道是否已连接 */
  const connected = ref(false);

  // =====================================================================
  // Getters
  // =====================================================================

  /** 总未读数 */
  const totalUnread = computed<number>(() => unreadCounts.value.total);

  /** 筛选后的列表 */
  const filteredItems = computed<NotificationItem[]>(() => {
    if (!activeFilter.value) return items.value;
    return items.value.filter((item) => item.type === activeFilter.value);
  });

  /** 是否有未读（UI 加粗铃铛） */
  const hasUnread = computed<boolean>(() => totalUnread.value > 0);

  // =====================================================================
  // Actions：通知入栈
  // =====================================================================

  /**
   * 由 SSE bridge / 各子系统调用，将一条通知推入中心。
   *
   * @param item 新通知（id 重复时忽略，避免 SSE 重放导致重复入栈）
   */
  function pushNotification(item: NotificationItem): void {
    // 去重
    if (items.value.some((existing) => existing.id === item.id)) return;

    // 队首插入
    items.value.unshift(item);

    // 未读计数递增
    if (!item.read) {
      const key = item.type as keyof NotificationUnreadCounts;
      if (key in unreadCounts.value) {
        (unreadCounts.value[key] as number) += 1;
        recomputeTotal();
      }
    }

    // 超长截断
    if (items.value.length > MAX_NOTIFICATION_ITEMS) {
      items.value = items.value.slice(0, MAX_NOTIFICATION_ITEMS);
    }
  }

  // =====================================================================
  // Actions：读取状态变更
  // =====================================================================

  /** 标记单条已读 */
  function markAsRead(id: string): void {
    const idx = items.value.findIndex((item) => item.id === id);
    if (idx === -1) return;
    const item = items.value[idx];
    if (item.read) return;

    item.read = true;
    const key = item.type as keyof NotificationUnreadCounts;
    if (key in unreadCounts.value) {
      (unreadCounts.value[key] as number) = Math.max(0, (unreadCounts.value[key] as number) - 1);
      recomputeTotal();
    }
  }

  /** 标记全部已读（可按类型筛选） */
  function markAllAsRead(type?: NotificationType): void {
    const scope = type ? items.value.filter((item) => item.type === type) : items.value;
    for (const item of scope) {
      item.read = true;
    }
    if (type) {
      unreadCounts.value[type] = 0;
    } else {
      unreadCounts.value.system = 0;
      unreadCounts.value.workflow = 0;
      unreadCounts.value.message = 0;
      unreadCounts.value.audit = 0;
    }
    recomputeTotal();
  }

  // =====================================================================
  // Actions：模块间同步
  // =====================================================================

  /**
   * 设置指定类型的未读数（由子系统 HTTP 接口刷新后调用）。
   *
   * @param type 通知类型
   * @param count 未读数
   */
  function setUnreadCount(type: NotificationType, count: number): void {
    unreadCounts.value[type] = Math.max(0, count);
    recomputeTotal();
  }

  /** 更新 SSE 连接状态 */
  function setConnected(value: boolean): void {
    connected.value = value;
  }

  /** 切换筛选 */
  function setFilter(type: NotificationType | null): void {
    activeFilter.value = type;
  }

  /** 清空所有通知（危险操作：通常在 logout 时调用） */
  function clearAll(): void {
    items.value = [];
    unreadCounts.value = { ...INITIAL_COUNTS };
  }

  // =====================================================================
  // 内部函数
  // =====================================================================

  /** 重新计算 total */
  function recomputeTotal(): void {
    const c = unreadCounts.value;
    c.total = c.system + c.workflow + c.message + c.audit;
  }

  // =====================================================================
  // 导出
  // =====================================================================

  return {
    // State
    activeFilter,
    connected,
    items,
    unreadCounts,

    // Getters
    filteredItems,
    hasUnread,
    totalUnread,

    // Actions
    clearAll,
    markAllAsRead,
    markAsRead,
    pushNotification,
    setConnected,
    setFilter,
    setUnreadCount,
  };
});
