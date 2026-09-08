/**
 * API Key 管理 API 封装（前端）
 *
 * <p>对应后端 {@code ApiKeyController}，提供 API Key 的完整生命周期管理能力：创建、分页查询、全量查询、批量撤销、启用/禁用。
 * <p>路径规范: /api/apikey/**（kebab-case），成功码统一为 code === 'A00000'。
 *
 * <p><b>安全约束：</b>
 * <ul>
 *   <li>所有端点需要登录态（通过统一网关鉴权）</li>
 *   <li>API Key 明文仅在创建时返回一次</li>
 *   <li>每个用户最多持有 10 个有效 API Key</li>
 * </ul>
 *
 * @author ydsz-team
 * @path apps/userinfo-web/src/api/apiKey.ts
 * @since 1.0.0
 */
import type { PageResponse } from './models';

import { requestClient } from '#/api/request';

/** API Key 创建请求 DTO（对齐后端 {@code ApiKeyCreateDTO}） */
export interface ApiKeyCreateDTO {
  /** Key 名称（用于标识用途，如 "jenkins-deploy"，必填，最大 64 字符） */
  keyName?: string;
  /** 授权范围（逗号分隔，如 "read,write"） */
  scopes?: string;
  /** 过期时间（天数），为空表示永不过期 */
  expireDays?: number;
  /** 每分钟请求限流阈值，为空表示使用默认配置 */
  rateLimit?: number;
}

/** API Key 分页查询参数（对齐后端 {@code ApiKeyPageQuery}） */
export interface ApiKeyPageQuery {
  /** 页码（从 1 开始，默认 1） */
  pageNum?: number;
  /** 每页大小（默认 20） */
  pageSize?: number;
  /** Key 名称模糊搜索 */
  keyName?: string;
  /** 按用户 ID 筛选 */
  userId?: string;
  /** 按启用状态筛选 */
  isEnabled?: boolean;
}

/** API Key 视图对象（对齐后端 {@code ApiKeyVO}） */
export interface ApiKeyVO {
  /** 主键 ID */
  id?: number;
  /** API Key 明文（仅创建时返回，其余场景为 null） */
  apiKey?: string;
  /** API Key 前缀（用于识别） */
  apiKeyPrefix?: string;
  /** Key 名称 */
  keyName?: string;
  /** 授权范围 */
  scopes?: string;
  /** 过期时间 */
  expireAt?: string;
  /** 最后使用时间 */
  lastUsedAt?: string;
  /** 每分钟限流阈值 */
  rateLimit?: number;
  /** 是否启用 */
  isEnabled?: boolean;
  /** 创建时间 */
  createdAt?: string;
}

/**
 * 创建 API Key。
 *
 * <p>POST /api/apikey
 * <p><b>注意：</b>返回的 {@code apiKey} 字段为明文，仅此次返回，请立即保存。
 *
 * @param data - 创建参数
 * @returns API Key VO（含明文 apiKey）
 */
export function createKey(data: ApiKeyCreateDTO): Promise<ApiKeyVO> {
  return requestClient.post<ApiKeyVO>('/api/apikey', data);
}

/**
 * 分页查询当前用户的 API Key 列表。
 *
 * <p>GET /api/apikey
 *
 * @param query - 分页查询参数
 * @returns 分页结果
 */
export function pageKeys(query: ApiKeyPageQuery): Promise<PageResponse<ApiKeyVO[]>> {
  return requestClient.get<PageResponse<ApiKeyVO[]>>('/api/apikey', { params: query });
}

/**
 * 查询当前用户的所有 API Key（不分页）。
 *
 * <p>GET /api/apikey/all
 *
 * @returns API Key VO 列表
 */
export function listMyKeys(): Promise<ApiKeyVO[]> {
  return requestClient.get<ApiKeyVO[]>('/api/apikey/all');
}

/**
 * 批量撤销（吊销）API Key。
 *
 * <p>DELETE /api/apikey?ids=1,2,3
 *
 * @param ids - 要撤销的 ID 集合
 * @returns 实际撤销数量
 */
export function revokeKeys(ids: number[]): Promise<number> {
  const params = new URLSearchParams();
  ids.forEach((id) => params.append('ids', String(id)));
  return requestClient.delete<number>(`/api/apikey?${params.toString()}`);
}

/**
 * 启用/禁用 API Key。
 *
 * <p>PUT /api/apikey/{id}/enabled?enabled=true
 *
 * @param id - 主键 ID
 * @param enabled - 启用/禁用
 */
export function updateEnabled(id: number, enabled: boolean): Promise<void> {
  return requestClient.put<void>(`/api/apikey/${id}/enabled?enabled=${enabled}`);
}
