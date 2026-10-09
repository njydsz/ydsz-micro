/**
 * MessageErrorCodesController API 封装
 *
 * <p>对应后端 {@code MessageErrorCodesController}，提供消息通道错误码的配置管理（CRUD）。
 * <p>路径规范: /api/v1/message/error-code/**（kebab-case），成功码统一为 code === 'A00000'。
 *
 * @path apps\message-web\src\api\messageErrorCodes.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { requestClient } from '#/api/request';
import type { PageResponse } from './models';

/**
 * 错误码配置 VO。
 *
 * 用于 Controller 层返回错误码配置的完整信息，包含错误码标识、错误消息模板、
 * 所属通道、重试策略、通知策略及状态，支撑消息通道错误码管理。
 */
export interface MsgErrorCodeVO {
  /** 错误码配置唯一标识（主键） */
  id?: string;
  /** 错误码标识（如 EMAIL_SEND_TIMEOUT） */
  errorCode?: string;
  /** 错误消息模板（支持 i18n key 或带占位符的文本） */
  errorMessage?: string;
  /** 通道类型（SMS/EMAIL/WEBHOOK/PUSH 等） */
  channelType?: string;
  /** 重试策略（NONE/SIMPLE/EXPONENTIAL_BACKOFF） */
  retryPolicy?: string;
  /** 通知策略（NONE/EMAIL_ADMIN/SMS_ADMIN/WEBHOOK_ALERT） */
  notifyPolicy?: string;
  /** 最大重试次数 */
  maxRetryCount?: number;
  /** 重试间隔基数（秒） */
  retryIntervalBase?: number;
  /** 状态（ENABLED/DISABLED） */
  status?: string;
  /** 描述说明 */
  description?: string;
  /** 创建人 */
  createdBy?: string;
  /** 创建时间 */
  createdAt?: string;
  /** 更新人 */
  updatedBy?: string;
  /** 更新时间 */
  updatedAt?: string;
}

/**
 * 错误码配置分页查询 DTO。
 */
export interface ErrorCodeQueryDTO {
  errorCode?: string;
  channelType?: string;
  status?: string;
  retryPolicy?: string;
  notifyPolicy?: string;
}

/**
 * 错误码配置新增/更新 DTO。
 */
export interface ErrorCodeUpsertDTO {
  /** 错误码标识 */
  errorCode?: string;
  /** 错误消息模板 */
  errorMessage?: string;
  /** 通道类型 */
  channelType?: string;
  /** 重试策略 */
  retryPolicy?: string;
  /** 通知策略 */
  notifyPolicy?: string;
  /** 最大重试次数 */
  maxRetryCount?: number;
  /** 重试间隔基数（秒） */
  retryIntervalBase?: number;
  /** 状态（ENABLED/DISABLED） */
  status?: string;
  /** 描述说明 */
  description?: string;
}

/**
 * page: GET /message/error-code/page
 */
export function page(query?: ErrorCodeQueryDTO): Promise<PageResponse<MsgErrorCodeVO[]>> {
  return requestClient.get<PageResponse<MsgErrorCodeVO[]>>(`/message/error-code/page`, { params: query });
}

/**
 * create: POST /message/error-code
 */
export function create(data: ErrorCodeUpsertDTO): Promise<MsgErrorCodeVO> {
  return requestClient.post<MsgErrorCodeVO>(`/message/error-code`, data);
}

/**
 * update: PUT /message/error-code/{id}
 */
export function update({ id }: { id: string }, data: ErrorCodeUpsertDTO): Promise<MsgErrorCodeVO> {
  return requestClient.put<MsgErrorCodeVO>(`/message/error-code/${id}`, data);
}

/**
 * remove: DELETE /message/error-code/{id}
 */
export function removeApi({ id }: { id: string }): Promise<void> {
  return requestClient.delete<void>(`/message/error-code/${id}`);
}

/**
 * toggleStatus: PUT /message/error-code/{id}/toggle-status
 */
export function toggleStatus({ id }: { id: string }): Promise<void> {
  return requestClient.put<void>(`/message/error-code/${id}/toggle-status`);
}
