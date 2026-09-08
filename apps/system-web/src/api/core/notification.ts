/**
 * 站内通知 API —— 收件箱分页/未读数/标记已读/全部已读接口（对齐后端 NotificationController）
 *
 * <p>后端契约：{@code NotificationController} 映射于 {@code /api/message/notifications}。
 *
 * <p>本模块为 system-web 子应用侧的类型化封装，字段与主应用侧 main/src/api/core/notification.ts
 * 保持同名对齐，避免重复实现。
 *
 * @path apps\system-web\src\api\core\notification.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { requestClient } from '#/api/request';

/** 后端站内通知视图对象（MsgNotificationVO 关键字段）。 */
interface MsgNotificationVO {
  id?: string;
  title?: string;
  content?: string;
  level?: string;
  category?: string;
  icon?: string;
  actionUrl?: string;
  readStatus?: number;
  createdAt?: string;
}

/** 后端分页响应。 */
interface PageResponse<T> {
  data: T;
  pageNum?: number;
  pageSize?: number;
  total?: number;
}

/** 通知列表项（前端 UI 结构）。 */
export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  category?: string;
  isRead: boolean;
  createdAt: string;
  avatar?: string;
  link?: string;
}

/** 通知分页查询参数。 */
export interface NotificationPageQuery {
  pageNum?: number;
  pageSize?: number;
  isRead?: 0 | 1;
  category?: string;
  level?: string;
}

/** 通知分页响应。 */
export interface NotificationPageResult {
  items: NotificationItem[];
  pageNum: number;
  pageSize: number;
  total: number;
}

/**
 * 后端 VO → 前端 UI 项映射。
 */
function toNotificationItem(vo: MsgNotificationVO): NotificationItem {
  return {
    avatar: vo.icon,
    category: vo.category,
    createdAt: vo.createdAt ?? '',
    id: vo.id ?? '',
    isRead: vo.readStatus === 1,
    link: vo.actionUrl,
    message: vo.content ?? '',
    title: vo.title ?? '',
    type: vo.level ?? 'INFO',
  };
}

/**
 * 分页查询当前用户收件箱通知。
 */
export async function getNotificationsApi(
  params: NotificationPageQuery = {},
): Promise<NotificationPageResult> {
  const query: Record<string, number | string> = {};
  if (params.pageNum !== undefined) query.pageNum = params.pageNum;
  if (params.pageSize !== undefined) query.pageSize = params.pageSize;
  if (params.isRead !== undefined) query.readStatus = params.isRead;
  if (params.category) query.category = params.category;
  if (params.level) query.level = params.level;

  const res = await requestClient.get<PageResponse<MsgNotificationVO[]>>(
    '/api/message/notifications/inbox',
    { params: query },
  );
  return {
    items: (res.data ?? []).map(toNotificationItem),
    pageNum: res.pageNum ?? 1,
    pageSize: res.pageSize ?? 0,
    total: res.total ?? 0,
  };
}

/**
 * 获取当前用户未读通知数量。
 */
export function getUnreadCountApi(): Promise<number> {
  return requestClient.get<number>(
    '/api/message/notifications/unreadCount',
  );
}

/**
 * 将指定通知标记为已读。
 */
export function markAsReadApi(id: string): Promise<boolean> {
  return requestClient.post<boolean>(
    `/api/message/notifications/${id}/read`,
  );
}

/**
 * 将当前用户全部通知标记为已读。
 */
export function markAllAsReadApi(): Promise<number> {
  return requestClient.post<number>('/api/message/notifications/readAll');
}

/**
 * 批量删除当前用户的通知。
 */
export function deleteNotificationsApi(ids: string[]): Promise<void> {
  return requestClient.delete<void>('/api/message/notifications', {
    data: ids,
  });
}
