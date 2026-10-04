/**
 * 操作审计 API —— 审计日志分页查询与详情接口定义
 *
 * <p>对接 ydz-audit 模块提供的操作日志 API，支持多维度过滤与详情 diff。
 * API 前缀由 VITE_AUDIT_API_URL 环境变量控制，默认 /api/v1/audit。
 *
 * @path main\src\api\audit.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { requestClient } from '#/api/request';

/** 审计操作类型枚举 */
export type AuditActionType =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'EXPORT';

/** 审计日志摘要（列表行）。 */
export interface AuditLog {
  /** 日志唯一 ID */
  id: string;
  /** 操作时间（ISO 8601 字符串） */
  actionTime: string;
  /** 操作人用户名 */
  operatorName: string;
  /** 操作人 ID */
  operatorId: string;
  /** 功能模块（如 system/user/config 等） */
  module: string;
  /** 操作类型 */
  actionType: AuditActionType;
  /** 简要描述 */
  description: string;
  /** 客户端 IP */
  clientIp: string;
  /** 客户端 User-Agent */
  userAgent?: string;
  /** 操作结果：SUCCESS / FAILED */
  result?: string;
}

/** 变更字段 diff 项。 */
export interface AuditDiffItem {
  /** 字段名 */
  field: string;
  /** 变更前值（序列化字符串） */
  oldValue: string | null;
  /** 变更后值（序列化字符串） */
  newValue: string | null;
}

/** 审计日志详情（含变更前后值 diff）。 */
export interface AuditLogDetail extends AuditLog {
  /** 变更字段 diff 列表 */
  diffs: AuditDiffItem[];
  /** 关联 session ID */
  sessionId?: string;
  /** 请求参数（JSON 字符串） */
  requestParams?: string;
  /** 响应数据（JSON 字符串） */
  responseData?: string;
  /** 错误信息（失败时） */
  errorMessage?: string;
}

/** 通用分页响应（对齐后端 PageResponse<T>）。 */
export interface PageResponse<T> {
  /** 总记录数 */
  total: number;
  /** 当前页码（从 1 开始） */
  pageNum: number;
  /** 每页记录数 */
  pageSize: number;
  /** 分页数据 */
  data: T;
}

/** 审计日志分页查询参数。 */
export interface AuditLogQueryParams {
  /** 页码，从 1 开始 */
  pageNum?: number;
  /** 每页条数 */
  pageSize?: number;
  /** 按操作人过滤 */
  operatorName?: string;
  /** 按模块过滤 */
  module?: string;
  /** 按操作类型过滤 */
  actionType?: AuditActionType;
  /** 时间范围起始（ISO 8601） */
  startTime?: string;
  /** 时间范围结束（ISO 8601） */
  endTime?: string;
  /** 关键词搜索（模糊匹配描述/IP） */
  keyword?: string;
  /** 按操作结果过滤 */
  result?: string;
}

/** 审计 API 基础路径（由环境变量控制）。 */
const AUDIT_API_URL =
  (import.meta.env.VITE_AUDIT_API_URL as string | undefined) ?? '/api/v1/audit';

/**
 * 分页查询审计日志。
 *
 * @param params - 分页与多维度过滤条件
 * @returns 分页结果，含 total 与日志条目数组
 */
export async function listAuditLogs(
  params: AuditLogQueryParams = {},
): Promise<PageResponse<AuditLog[]>> {
  const query: Record<string, string | number | undefined> = {
    pageNum: params.pageNum ?? 1,
    pageSize: params.pageSize ?? 20,
    operatorName: params.operatorName || undefined,
    module: params.module || undefined,
    actionType: params.actionType || undefined,
    startTime: params.startTime || undefined,
    endTime: params.endTime || undefined,
    keyword: params.keyword || undefined,
    result: params.result || undefined,
  };

  const res = await requestClient.get<PageResponse<AuditLog[]>>(AUDIT_API_URL, {
    params: query,
  });
  return {
    total: res?.total ?? 0,
    pageNum: res?.pageNum ?? params.pageNum ?? 1,
    pageSize: res?.pageSize ?? params.pageSize ?? 20,
    data: res?.data ?? [],
  };
}

/**
 * 获取单条审计日志详情（含变更 diff）。
 *
 * @param id - 审计日志 ID
 * @returns 审计日志详情
 */
export async function getAuditLogDetail(
  id: string,
): Promise<AuditLogDetail> {
  const res = await requestClient.get<AuditLogDetail>(`${AUDIT_API_URL}/${id}`);
  return {
    ...res,
    diffs: res?.diffs ?? [],
  };
}

/**
 * 导出审计日志（触发二次认证后调用）。
 *
 * @param params - 过滤条件（与 listAuditLogs 参数一致，但不分页）
 * @returns 导出文件流
 */
export async function exportAuditLogs(params: AuditLogQueryParams = {}): Promise<void> {
  const query: Record<string, string | undefined> = {
    operatorName: params.operatorName || undefined,
    module: params.module || undefined,
    actionType: params.actionType || undefined,
    startTime: params.startTime || undefined,
    endTime: params.endTime || undefined,
    keyword: params.keyword || undefined,
    result: params.result || undefined,
  };

  await requestClient.post(`${AUDIT_API_URL}/export`, query);
}
