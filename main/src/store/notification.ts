/**
 * notification Pinia 状态管理
 *
 * v4.1: 由 class-based singleton 迁移为 Pinia setup store，
 *       获得 DevTools 调试、$reset、$subscribe 等 Pinia 内置能力。
 *
 * @path main\src\store\notification.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { NotificationApi } from "#/api/core/notification";

import { ref } from "vue";

import { useTokenStore } from "@ydsz/stores";
import { createLogger } from "@YDSZ-core/shared/utils";

import { ElNotification } from "element-plus";
import { defineStore } from "pinia";

import {
  getNotificationsApi,
  getUnreadCountApi,
  markAllAsReadApi,
  markAsReadApi,
} from "#/api/core/notification";

/** 模块级日志器 */
const logger = createLogger("NotificationStore");

/**
 * 全局通知 Store — 整合 REST API + WebSocket 实时推送。
 *
 * Pinia setup store：state（notifications/unreadCount/wsConnected）自动解包，
 * actions（loadNotifications 等）供组件与布局直接调用。
 */
export const useNotificationStore = defineStore("notification", () => {
  /** 通知列表（响应式） */
  const notifications = ref<NotificationApi.NotificationItem[]>([]);
  /** 未读通知数量（响应式） */
  const unreadCount = ref(0);
  /** WebSocket 是否已连接（响应式） */
  const wsConnected = ref(false);

  let ws: null | WebSocket = null;
  let reconnectTimer: null | ReturnType<typeof setTimeout> = null;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 10;
  const reconnectDelay = 5000;

  /**
   * 从后端分页加载通知列表，并同步未读总数。
   *
   * @param pageNum - 页码，默认 1
   * @param pageSize - 每页条数，默认 20
   */
  async function loadNotifications(pageNum = 1, pageSize = 20) {
    try {
      const res = await getNotificationsApi({ pageNum, pageSize });
      notifications.value = res.items;
      unreadCount.value = res.total;
    } catch {
      // 静默失败
    }
  }

  /**
   * 刷新未读计数
   */
  async function refreshUnreadCount() {
    try {
      unreadCount.value = await getUnreadCountApi();
    } catch {
      // 静默失败
    }
  }

  /**
   * 标记单条通知为已读，并递减未读计数。
   *
   * @param id - 通知 ID
   */
  async function markRead(id: string) {
    try {
      await markAsReadApi(id);
      const item = notifications.value.find((n) => n.id === id);
      if (item && !item.isRead) {
        item.isRead = true;
        unreadCount.value = Math.max(0, unreadCount.value - 1);
      }
    } catch {
      // 静默失败
    }
  }

  /**
   * 全部标记已读
   */
  async function markAllRead() {
    try {
      await markAllAsReadApi();
      notifications.value.forEach((n) => (n.isRead = true));
      unreadCount.value = 0;
    } catch {
      // 静默失败
    }
  }

  /**
   * 处理 WebSocket 推送消息（新通知 / 未读数更新 / 多端已读同步）。
   *
   * @param data - 服务端推送的消息体
   */
  function handleWsMessage(data: any) {
    switch (data.type) {
      case "mark_read": {
        // 标记已读（多端同步）
        const item = notifications.value.find(
          (n) => n.id === data.notificationId,
        );
        if (item) item.isRead = true;
        break;
      }
      case "notification": {
        // 新通知
        const notification: NotificationApi.NotificationItem = data.payload;
        notifications.value.unshift(notification);
        unreadCount.value++;

        // 弹出桌面通知
        ElNotification({
          title: notification.title || "新通知",
          message: notification.message,
          type: "info",
          duration: 5000,
        });
        break;
      }
      case "unread_count": {
        // 未读数更新
        unreadCount.value = data.count ?? 0;
        break;
      }
      default: {
        // 未知消息类型忽略
        break;
      }
    }
  }

  /**
   * 自动重连（指数退避，最多 maxReconnectAttempts 次）
   */
  function scheduleReconnect() {
    if (reconnectAttempts >= maxReconnectAttempts) {
      logger.warn("[WS] Max reconnection attempts reached, giving up.");
      return;
    }

    if (reconnectTimer) clearTimeout(reconnectTimer);

    reconnectAttempts++;
    const delay = reconnectDelay * reconnectAttempts;

    reconnectTimer = setTimeout(() => {
      logger.info(
        `[WS] Reconnecting (attempt ${reconnectAttempts}/${maxReconnectAttempts})...`,
      );
      connectWebSocket();
    }, delay);
  }

  /**
   * 连接 WebSocket 接收实时通知
   */
  function connectWebSocket() {
    if (ws?.readyState === WebSocket.OPEN) return;

    const tokenStore = useTokenStore();
    const token = tokenStore.accessToken;
    if (!token) return;

    // 构建 WebSocket URL
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/notification?token=${token}`;

    try {
      ws = new WebSocket(wsUrl);

      ws.addEventListener("open", () => {
        logger.info("[WS] Notification WebSocket connected");
        wsConnected.value = true;
        reconnectAttempts = 0;
      });

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWsMessage(data);
        } catch {
          // 非法 JSON 忽略
        }
      };

      ws.addEventListener("close", () => {
        logger.info("[WS] Notification WebSocket closed");
        wsConnected.value = false;
        scheduleReconnect();
      });

      ws.onerror = (error) => {
        logger.error("[WS] Notification WebSocket error:", error);
        wsConnected.value = false;
      };
    } catch (error) {
      logger.error("[WS] Failed to connect WebSocket:", error);
      scheduleReconnect();
    }
  }

  /**
   * 断开 WebSocket
   */
  function disconnect() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    reconnectAttempts = maxReconnectAttempts; // 阻止自动重连
    if (ws) {
      ws.onclose = null; // 防止触发重连
      ws.close();
      ws = null;
    }
    wsConnected.value = false;
  }

  return {
    // state
    notifications,
    unreadCount,
    wsConnected,
    // actions
    loadNotifications,
    refreshUnreadCount,
    markRead,
    markAllRead,
    connectWebSocket,
    disconnect,
  };
});
