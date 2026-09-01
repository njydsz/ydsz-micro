/**
 * 站内通知 API —— 收件箱分页/未读数/标记已读/批量删除接口（对齐后端 NotificationController）
 *
 * <p>后端契约：{@code NotificationController} 映射于 {@code /api/v1/message/notifications}，
 * 提供 收件箱分页(inbox) / 未读数(unreadCount) / 标记已读({id}/read) / 全部已读(readAll) / 批量删除(delete)。
 * 此前主应用误用 {@code /api/v1/notification/*}（后端不存在该路径），已在 P5 对齐。
 *
 * <p>本模块为主应用侧的类型化封装：后端 VO（MsgNotificationVO）在此映射为 UI 所需结构
 * （{@link NotificationItem}），收件箱分页响应映射为 {@link NotificationPageResult}。
 *
 * @path main\src\api\core\notification.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { requestClient } from '#/api/request';

/** 后端站内通知视图对象（MsgNotificationVO 关键字段，仅供 API 层映射使用）。 */
export interface MsgNotificationVO {
  /** 通知唯一标识 */
  id?: string;
  /** 通知标题 */
  title?: string;
  /** 通知内容（映射为前端 message） */
  content?: string;
  /** 级别（INFO/WARN/ERROR/CRITICAL） */
  level?: string;
  /** 分类 */
  category?: string;
  /** 图标 */
  icon?: string;
  /** 操作跳转 URL */
  actionUrl?: string;
  /** 已读状态：0=未读，1=已读 */
  readStatus?: number;
  /** 创建时间（ISO 字符串） */
  createdAt?: string;
}

/** 后端分页响应（PageResponse<T>：total/pageNum/pageSize 平铺 + data 分页数据）。 */
interface PageResponse<T> {
  /** 总记录数 */
  total?: number;
  /** 当前页码（从 1 开始） */
  pageNum?: number;
  /** 每页记录数 */
  pageSize?: number;
  /** 分页数据 */
  data: T;
}

/** 通知列表项（主应用 UI 结构，字段由 API 层从后端 VO 映射而来）。 */
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

/** 通知分页查询参数（映射后端 NotificationQueryDTO 分页段）。 */
export interface NotificationPageQuery {
  /** 页码，从 1 开始 */
  pageNum?: number;
  /** 每页条数 */
  pageSize?: number;
  /** 按已读状态过滤：0=未读，1=已读 */
  isRead?: 0 | 1;
  /** 按分类过滤 */
  category?: string;
  /** 按级别过滤 */
  level?: string;
}

/** 通知分页响应（对齐后端 PageResponse<MsgNotificationVO[]>，data 在此映射为 items）。 */
export interface NotificationPageResult {
  /** 总记录数 */
  total: number;
  /** 当前页码 */
  pageNum: number;
  /** 每页条数 */
  pageSize: number;
  /** 通知条目数组 */
  items: NotificationItem[];
}

/**
 * 后端 VO → 前端 UI 项映射。
 *
 * @param vo 后端站内通知 VO
 * @returns 前端渲染所需的通知项
 */
function toNotificationItem(vo: MsgNotificationVO): NotificationItem {
  return {
    id: vo.id ?? '',
    title: vo.title ?? '',
    message: vo.content ?? '',
    type: vo.level ?? 'INFO',
    category: vo.category,
    isRead: vo.readStatus === 1,
    createdAt: vo.createdAt ?? '',
    avatar: vo.icon,
    link: vo.actionUrl,
  };
}

/**
 * 分页查询当前用户收件箱通知。
 *
 * @param params - 分页与过滤条件（页码、条数、已读状态、分类、级别）
 * @returns 分页结果，含 total / pageNum / pageSize 与通知条目数组
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
    '/api/v1/message/notifications/inbox',
    { params: query },
  );
  return {
    total: res.total ?? 0,
    pageNum: res.pageNum ?? 1,
    pageSize: res.pageSize ?? 0,
    items: (res.data ?? []).map(toNotificationItem),
  };
}

/**
 * 获取当前用户未读通知数量。
 *
 * @returns 未读通知总数（用于导航角标展示）
 */
export function getUnreadCountApi() {
  return requestClient.get<number>('/api/v1/message/notifications/unreadCount');
}

/**
 * 将指定通知标记为已读。
 *
 * @param id - 通知 ID
 * @returns 是否标记成功
 */
export function markAsReadApi(id: string) {
  return requestClient.post<boolean>(
    `/api/v1/message/notifications/${id}/read`,
  );
}

/**
 * 将当前用户全部通知标记为已读。
 *
 * @returns 本次成功标记的条数
 */
export function markAllAsReadApi() {
  return requestClient.post<number>('/api/v1/message/notifications/readAll');
}

/**
 * 批量删除当前用户的通知（仅能删除自己的）。
 *
 * @param ids - 通知 ID 列表
 * @returns 空响应（无业务数据）
 */
export function deleteNotificationsApi(ids: string[]) {
  return requestClient.delete<void>('/api/v1/message/notifications', {
    data: ids,
  });
}