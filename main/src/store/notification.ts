/**
 * 通知 Pinia Store —— 整合 REST 分页加载、SSE 实时推送与本地持久化
 *
 * @path main\src\store\notification.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { NotificationItem, NotificationPageResult } from "#/api/core/notification";

import { ref } from "vue";

import { createLogger } from "@ydsz-core/shared/utils";

import { defineStore } from "pinia";
import { showToast } from "@ydsz/notification";

import {
  deleteNotificationsApi,
  getNotificationsApi,
  getUnreadCountApi,
  markAllAsReadApi,
  markAsReadApi,
} from "#/api/core/notification";

/** 模块级日志器 */
const logger = createLogger("NotificationStore");

/** SSE 推送消息类型 */
interface SseNotificationMessage {
  /** 消息事件类型 */
  event: 'new_notification' | 'mark_read' | 'unread_count' | 'notification_deleted';
  /** 通知数据体 */
  data?: NotificationItem;
  /** mark_read 时的通知 ID */
  notificationId?: string;
  /** unread_count 时的计数值 */
  count?: number;
  /** notification_deleted 时的通知 ID */
  deletedId?: string;
}

/** 持久化 Storage key */
const PERSIST_KEY = "ydsz-notification-store";

/**
 * 从 localStorage 恢复持久化的通知列表（SSR 安全）。
 */
function loadPersistedState(): { notifications: NotificationItem[]; unreadCount: number } {
  try {
    if (typeof localStorage === "undefined") {
      return { notifications: [], unreadCount: 0 };
    }
    const raw = localStorage.getItem(PERSIST_KEY);
    if (!raw) return { notifications: [], unreadCount: 0 };
    const parsed = JSON.parse(raw);
    return {
      notifications: parsed.notifications ?? [],
      unreadCount: parsed.unreadCount ?? 0,
    };
  } catch {
    return { notifications: [], unreadCount: 0 };
  }
}

/**
 * 持久化通知列表到 localStorage（SSR 安全）。
 */
function persistState(notifications: NotificationItem[], unreadCount: number): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(
      PERSIST_KEY,
      JSON.stringify({ notifications, unreadCount }),
    );
  } catch {
    // quota / private mode 静默失败
  }
}

const persisted = loadPersistedState();

/**
 * 全局通知 Store — 整合 REST API + SSE 实时推送 + 本地持久化。
 *
 * Pinia setup store：state（notifications/unreadCount/sseConnected）自动解包，
 * actions（fetchNotifications / markAsRead 等）供组件与布局直接调用。
 *
 * 连接建立由 {@link useNotificationSse} composable 负责，Store 仅暴露 handleSseMessage
 * 回调供 composable 调用。
 */
export const useNotificationStore = defineStore("notification", () => {
  /** 通知列表（响应式） */
  const notifications = ref<NotificationItem[]>(persisted.notifications);
  /** 未读通知数量（响应式） */
  const unreadCount = ref(persisted.unreadCount);
  /** SSE 是否已连接（响应式） */
  const sseConnected = ref(false);

  /** 后端分页 total（fetch 后由 store 内部维护） */
  const totalCount = ref(0);

  /**
   * 触发持久化（防抖阈值：每次状态变更后低频写入即可）。
   */
  function syncPersist() {
    persistState(notifications.value, unreadCount.value);
  }

  /**
   * 从后端分页加载收件箱通知列表。
   *
   * <p>未读数以 {@link refreshUnreadCount} 接口为准，此处不覆盖未读角标。
   *
   * @param page - 页码，默认 1
   * @param size - 每页条数，默认 100（大值一次性加载用于前端分页）
   */
  async function fetchNotifications(page = 1, size = 100): Promise<NotificationPageResult> {
    try {
      const res = await getNotificationsApi({ pageNum: page, pageSize: size });
      notifications.value = res.items;
      totalCount.value = res.total;
      syncPersist();
      return res;
    } catch (error) {
      logger.error("[NotificationStore] fetchNotifications failed:", error);
      throw error;
    }
  }

  /**
   * 刷新未读计数
   */
  async function refreshUnreadCount() {
    try {
      unreadCount.value = await getUnreadCountApi();
      syncPersist();
    } catch {
      // 静默失败
    }
  }

  /**
   * 标记单条通知为已读，并递减未读计数。
   *
   * @param id - 通知 ID
   */
  async function markAsRead(id: string) {
    try {
      await markAsReadApi(id);
      const item = notifications.value.find((n) => n.id === id);
      if (item && !item.isRead) {
        item.isRead = true;
        unreadCount.value = Math.max(0, unreadCount.value - 1);
        syncPersist();
      }
    } catch {
      // 静默失败
    }
  }

  /**
   * 全部标记已读
   */
  async function markAllAsRead() {
    try {
      await markAllAsReadApi();
      notifications.value.forEach((n) => (n.isRead = true));
      unreadCount.value = 0;
      syncPersist();
    } catch {
      // 静默失败
    }
  }

  /**
   * 删除单条通知（SSE 推送到达时也可调用，保持多端一致）。
   *
   * @param id - 通知 ID
   */
  async function removeNotification(id: string) {
    try {
      await deleteNotificationsApi([id]);
      const idx = notifications.value.findIndex((n) => n.id === id);
      if (idx > -1) {
        const item = notifications.value[idx];
        if (!item.isRead) {
          unreadCount.value = Math.max(0, unreadCount.value - 1);
        }
        notifications.value.splice(idx, 1);
        syncPersist();
      }
    } catch {
      // 静默失败
    }
  }

  /**
   * 清空全部通知。
   */
  function clearAll() {
    notifications.value = [];
    unreadCount.value = 0;
    syncPersist();
  }

  /**
   * SSE 推送：新增通知。
   *
   * <p>由 {@link useNotificationSse} composable 在收到 SSE 帧时调用。
   * 前置插入 + 未读 +1 + 弹出 toast。
   *
   * @param item - 新通知条目
   */
  function addItem(item: NotificationItem) {
    // 去重：避免重复推送覆盖
    const exists = notifications.value.some((n) => n.id === item.id);
    if (exists) return;
    notifications.value.unshift(item);
    unreadCount.value++;
    syncPersist();

    // 弹出桌面 toast
    const toastVariant = item.type === "ERROR" || item.type === "FATAL"
      ? "error"
      : item.type === "WARN" || item.type === "WARNING"
        ? "warning"
        : item.type === "SUCCESS"
          ? "success"
          : "info";

    showToast(item.title || "新通知", {
      description: item.message,
      variant: toastVariant,
      duration: 5000,
    });
  }

  /**
   * SSE 推送：处理 mark_read 事件（多端同步）。
   *
   * @param notificationId - 已读通知 ID
   */
  function handleSseMarkRead(notificationId: string) {
    const item = notifications.value.find((n) => n.id === notificationId);
    if (item && !item.isRead) {
      item.isRead = true;
      unreadCount.value = Math.max(0, unreadCount.value - 1);
      syncPersist();
    }
  }

  /**
   * SSE 推送：同步未读计数。
   *
   * @param count - 后端最新未读数
   */
  function handleSseUnreadCount(count: number) {
    unreadCount.value = count;
    syncPersist();
  }

  /**
   * SSE 推送：删除通知。
   *
   * @param deletedId - 已删除通知 ID
   */
  function handleSseDelete(deletedId: string) {
    const idx = notifications.value.findIndex((n) => n.id === deletedId);
    if (idx > -1) {
      const item = notifications.value[idx];
      if (!item.isRead) {
        unreadCount.value = Math.max(0, unreadCount.value - 1);
      }
      notifications.value.splice(idx, 1);
      syncPersist();
    }
  }

  /**
   * SSE 推送：统一消息入口，解析事件类型并分发。
   *
   * @param message - SSE 数据体
   */
  function handleSseMessage(message: SseNotificationMessage) {
    switch (message.event) {
      case "new_notification": {
        if (message.data) {
          addItem(message.data);
        }
        break;
      }
      case "mark_read": {
        if (message.notificationId) {
          handleSseMarkRead(message.notificationId);
        }
        break;
      }
      case "unread_count": {
        handleSseUnreadCount(message.count ?? 0);
        break;
      }
      case "notification_deleted": {
        if (message.deletedId) {
          handleSseDelete(message.deletedId);
        }
        break;
      }
      default:
        break;
    }
  }

  /**
   * 设置 SSE 连接状态。
   *
   * @param status - true=已连接
   */
  function setSseConnected(status: boolean) {
    sseConnected.value = status;
  }

  return {
    // state
    notifications,
    unreadCount,
    sseConnected,
    totalCount,
    // actions
    fetchNotifications,
    refreshUnreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    addItem,
    handleSseMessage,
    setSseConnected,
  };
});
