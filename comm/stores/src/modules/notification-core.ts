/**
 * 通知 Store 共享核心逻辑
 *
 * <p>封装通知列表 / 未读计数 / 已读标记等 REST 交互（两个业务模块共用）。
 * <p>main (WebSocket) 与 system-web (SSE) 分别组合本核心 + 各自的传输层。
 *
 * <p>使用方式：
 * ```ts
 * // apps/system-web/src/store/notification.ts
 * import { createNotificationCore } from '@ydsz/stores';
 *
 * export const useNotificationStore = defineStore('notification', () => {
 *   const core = createNotificationCore({ getNotificationsApi, ... });
 *   // 添加 SSE 特有的 connected/reconnecting/addNotification ...
 *   return { ...core.state, ...core.actions, ... };
 * });
 * ```
 *
 * @path comm\stores\src\modules\notification-core.ts
 * @author ydsz-team
 * @since 26.10.02
 */

import type { Ref } from 'vue';
import { ref } from 'vue';

import { createLogger } from '@ydsz-core/shared/utils';

/** 模块级日志器 */
const logger = createLogger('NotificationCore');

/** 通知条目类型 —— 兼容后端 MsgNotificationVO 结构 */
export interface NotificationItem {
  /** 通知唯一 ID */
  id: string;
  /** 通知标题 */
  title: string;
  /** 通知正文内容 */
  message: string;
  /** 通知级别（INFO / WARN / ERROR 等） */
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

/** 分页查询结果（与后端对齐） */
interface NotificationPageResult {
  items: NotificationItem[];
  pageNum?: number;
  pageSize?: number;
  total?: number;
}

/** 创建通知核心所需的 API 函数集合 */
export interface NotificationCoreApis {
  /** 分页加载通知列表 */
  getNotificationsApi: (params: { pageNum?: number; pageSize?: number }) => Promise<NotificationPageResult>;
  /** 获取未读计数 */
  getUnreadCountApi: () => Promise<number>;
  /** 标记单条已读 */
  markAsReadApi: (id: string) => Promise<unknown>;
  /** 全部标记已读 */
  markAllAsReadApi: () => Promise<unknown>;
}

/** 通知核心 state + actions 返回类型 */
export interface NotificationCoreReturn {
  /** 通知列表（响应式） */
  notifications: Ref<NotificationItem[]>;
  /** 未读通知数量（响应式） */
  unreadCount: Ref<number>;
  /** 从后端分页加载通知列表 */
  loadNotifications: (pageNum?: number, pageSize?: number) => Promise<void>;
  /** 刷新未读计数 */
  refreshUnreadCount: () => Promise<void>;
  /** 标记单条通知为已读，并递减未读计数 */
  markRead: (id: string) => Promise<void>;
  /** 全部标记已读 */
  markAllRead: () => Promise<void>;
}

/**
 * 创建通知核心 state 与 actions（不含传输层，WebSocket / SSE 各自扩展）
 *
 * @param apis - API 函数集合（由调用方注入，适配各应用的 api 模块）
 * @returns 响应式状态 + 操作 actions
 */
function createNotificationCore(apis: NotificationCoreApis): NotificationCoreReturn {
  const notifications = ref<NotificationItem[]>([]);
  const unreadCount = ref(0);

  /**
   * 从后端分页加载通知列表
   *
   * @param pageNum - 页码（默认 1）
   * @param pageSize - 每页条数（默认 20）
   */
  async function loadNotifications(pageNum = 1, pageSize = 20): Promise<void> {
    try {
      const res = await apis.getNotificationsApi({ pageNum, pageSize });
      notifications.value = res.items;
    } catch (error) {
      logger.warn('加载通知列表失败', error);
    }
  }

  /**
   * 刷新未读计数
   */
  async function refreshUnreadCount(): Promise<void> {
    try {
      unreadCount.value = await apis.getUnreadCountApi();
    } catch (error) {
      logger.warn('刷新未读计数失败', error);
    }
  }

  /**
   * 标记单条通知为已读，并递减未读计数
   *
   * @param id - 通知 ID
   */
  async function markRead(id: string): Promise<void> {
    try {
      await apis.markAsReadApi(id);
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
   * 全部标记已读
   */
  async function markAllRead(): Promise<void> {
    try {
      await apis.markAllAsReadApi();
      notifications.value.forEach((n) => {
        n.isRead = true;
      });
      unreadCount.value = 0;
    } catch (error) {
      logger.warn('全部标记已读失败', error);
    }
  }

  return {
    // state
    notifications,
    unreadCount,
    // actions
    loadNotifications,
    refreshUnreadCount,
    markRead,
    markAllRead,
  };
}

export { createNotificationCore };
