/**
 * 通知 Pinia Store —— 通知列表与未读计数管理
 *
 * <p>基于 SSE 长连接接收实时通知，同时通过 HTTP API 同步数据。
 * <p>核心 CRUD 逻辑已提取至 {@link createNotificationCore}（@ydsz/stores），
 * 本模块仅保留 SSE 通道相关的连接状态、去重入栈等扩展能力。
 *
 * @path apps\system-web\src\store\notification.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { computed, ref } from 'vue';

import {
  createNotificationCore,
  type NotificationItem,
} from '@ydsz/stores';
import { showNotify } from '@ydsz/notification';
import { defineStore } from 'pinia';

import {
  getNotificationsApi,
  getUnreadCountApi,
  markAllAsReadApi,
  markAsReadApi,
} from '#/api/core/notification';

/** 重新导出 NotificationItem 类型供外部使用 */
export type { NotificationItem };

/**
 * 系统管理子应用 / 通知 Pinia Store
 *
 * <p>整合 REST 分页加载（共享核心）与 SSE/EventSource 实时推送（本模块扩展）。
 *
 * @returns Pinia store 实例，包含响应式状态、计算属性与 actions
 */
export const useNotificationStore = defineStore('notification', () => {
  // =====================================================================
  // 共享核心（state + CRUD actions）—— 来自 @ydsz/stores
  // =====================================================================

  const core = createNotificationCore({
    getNotificationsApi,
    getUnreadCountApi,
    markAllAsReadApi,
    markAsReadApi,
  });

  // =====================================================================
  // SSE 通道相关状态（本模块扩展）
  // =====================================================================

  /** SSE 通道是否已连接 */
  const connected = ref(false);

  /** SSE 重连中标志 */
  const reconnecting = ref(false);

  // =====================================================================
  // 计算属性
  // =====================================================================

  /** 是否有未读通知 */
  const hasUnread = computed<boolean>(() => core.unreadCount.value > 0);

  /** 最近 10 条未读通知 */
  const recentUnread = computed<NotificationItem[]>(() =>
    core.notifications.value.filter((n: NotificationItem) => !n.isRead).slice(0, 10),
  );

  // =====================================================================
  // Actions：通知入栈（SSE 推送 / 轮询新增时调用）
  // =====================================================================

  /**
   * 将新通知添加到列表头部，自动去重并递增未读计数。
   *
   * @param item - 新增通知
   */
  function addNotification(item: NotificationItem): void {
    if (core.notifications.value.some((existing) => existing.id === item.id)) {
      return;
    }

    core.notifications.value.unshift(item);

    if (!item.isRead) {
      core.unreadCount.value++;
      showNotify(item.title || '新通知', item.message, 'INFO');
    }
  }

  // =====================================================================
  // Actions：连接状态管理
  // =====================================================================

  /**
   * 更新 SSE 连接状态。
   *
   * @param status - true 已连接，false 未连接
   */
  function setConnected(status: boolean): void {
    connected.value = status;
    reconnecting.value = status ? false : reconnecting.value;
  }

  /**
   * 设置重连中状态。
   *
   * @param status - true 重连中，false 非重连中
   */
  function setReconnecting(status: boolean): void {
    reconnecting.value = status;
  }

  /**
   * 清空所有通知（通常在登出时调用）。
   */
  function clearAll(): void {
    core.notifications.value = [];
    core.unreadCount.value = 0;
  }

  // =====================================================================
  // 导出
  // =====================================================================

  return {
    // State
    connected,
    notifications: core.notifications,
    reconnecting,
    unreadCount: core.unreadCount,

    // Getters
    hasUnread,
    recentUnread,

    // Actions
    addNotification,
    clearAll,
    loadNotifications: core.loadNotifications,
    markAllRead: core.markAllRead,
    markRead: core.markRead,
    refreshUnreadCount: core.refreshUnreadCount,
    setConnected,
    setReconnecting,
  };
});
