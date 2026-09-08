/**
 * 通知 Pinia Store —— 通知列表与未读计数管理
 *
 * <p>基于 SSE 长连接接收实时通知，同时通过 HTTP API 同步数据。
 * 整合 REST 分页加载与 SSE/EventSource 实时推送。
 *
 * @path apps\system-web\src\store\notification.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { computed, ref } from 'vue';

import { createLogger } from '@ydsz-core/shared/utils';
import { ElNotification } from 'element-plus';
import { defineStore } from 'pinia';

import {
  markAllAsReadApi,
  markAsReadApi,
} from '#/api/core/notification';
import {
  getNotificationsApi,
  getUnreadCountApi,
} from '../composables/useNotificationSse';

/** 模块级日志器 */
const logger = createLogger('NotificationStore');

/** 通知条目类型 —— 兼容后端 MsgNotificationVO 结构 */
export interface NotificationItem {
  /** 通知唯一 ID */
  id: string;
  /** 通知标题 */
  title: string;
  /** 通知正文内容 */
  message: string;
  /** 通知级别（如 INFO / WARN / ERROR） */
  type: string;
  /** 通知分类，可选 */
  category?: string;
  /** 是否已读 */
  isRead: boolean;
  /** 创建时间（ISO 字符串） */
  createdAt: string;
  /** 发送者图标 URL，可选 */
  avatar?: string;
  /** 点击通知跳转的链接，可选 */
  link?: string;
}

export const useNotificationStore = defineStore('notification', () => {
  // =====================================================================
  // State
  // =====================================================================

  /** 通知列表（响应式） */
  const notifications = ref<NotificationItem[]>([]);

  /** 未读通知数量（响应式） */
  const unreadCount = ref(0);

  /** SSE 通道是否已连接 */
  const connected = ref(false);

  /** SSE 重连中标志 */
  const reconnecting = ref(false);

  // =====================================================================
  // Getters（计算属性）
  // =====================================================================

  /** 是否有未读通知 */
  const hasUnread = computed<boolean>(() => unreadCount.value > 0);

  /** 最近 10 条未读通知 */
  const recentUnread = computed<NotificationItem[]>(() =>
    notifications.value.filter((n) => !n.isRead).slice(0, 10),
  );

  // =====================================================================
  // Actions：通知入栈
  // =====================================================================

  /**
   * 将新通知添加到列表头部（SSE 推送 / 轮询新增时调用）。
   *
   * @param item - 新增通知
   */
  function addNotification(item: NotificationItem): void {
    // 去重
    if (notifications.value.some((existing) => existing.id === item.id)) {
      return;
    }

    notifications.value.unshift(item);

    // 未读计数递增
    if (!item.isRead) {
      unreadCount.value++;
    }

    // 弹出桌面通知
    if (!item.isRead) {
      ElNotification({
        title: item.title || '新通知',
        message: item.message,
        type: 'info',
        duration: 5000,
      });
    }
  }

  // =====================================================================
  // Actions：读取状态变更
  // =====================================================================

  /**
   * 标记单条通知为已读，并递减未读计数。
   *
   * @param id - 通知 ID
   */
  async function markRead(id: string): Promise<void> {
    try {
      await markAsReadApi(id);
      const item = notifications.value.find((n) => n.id === id);
      if (item && !item.isRead) {
        item.isRead = true;
        unreadCount.value = Math.max(0, unreadCount.value - 1);
      }
    } catch (error) {
      logger.warn('标记通知已读失败', error);
    }
  }

  /**
   * 全部标记已读。
   */
  async function markAllRead(): Promise<void> {
    try {
      await markAllAsReadApi();
      notifications.value.forEach((n) => (n.isRead = true));
      unreadCount.value = 0;
    } catch (error) {
      logger.warn('全部标记已读失败', error);
    }
  }

  // =====================================================================
  // Actions：HTTP 同步
  // =====================================================================

  /**
   * 从后端分页加载通知列表。
   *
   * @param pageNum - 页码（默认 1）
   * @param pageSize - 每页条数（默认 20）
   */
  async function loadNotifications(pageNum = 1, pageSize = 20): Promise<void> {
    try {
      const res = await getNotificationsApi({ pageNum, pageSize });
      notifications.value = res.items;
    } catch (error) {
      logger.warn('加载通知列表失败', error);
    }
  }

  /**
   * 调用 HTTP API 同步未读计数。
   */
  async function refreshUnreadCount(): Promise<void> {
    try {
      unreadCount.value = await getUnreadCountApi();
    } catch (error) {
      logger.warn('刷新未读计数失败', error);
    }
  }

  // =====================================================================
  // Actions：连接状态
  // =====================================================================

  /**
   * 更新 SSE 连接状态。
   *
   * @param status - true 已连接，false 未连接
   */
  function setConnected(status: boolean): void {
    connected.value = status;
    if (status) {
      reconnecting.value = false;
    }
  }

  /** 设置重连中状态 */
  function setReconnecting(status: boolean): void {
    reconnecting.value = status;
  }

  // =====================================================================
  // Actions：重置
  // =====================================================================

  /** 清空所有通知（通常在登出时调用） */
  function clearAll(): void {
    notifications.value = [];
    unreadCount.value = 0;
  }

  // =====================================================================
  // 导出
  // =====================================================================

  return {
    // State
    connected,
    notifications,
    reconnecting,
    unreadCount,

    // Getters
    hasUnread,
    recentUnread,

    // Actions
    addNotification,
    clearAll,
    loadNotifications,
    markAllRead,
    markRead,
    refreshUnreadCount,
    setConnected,
    setReconnecting,
  };
});
