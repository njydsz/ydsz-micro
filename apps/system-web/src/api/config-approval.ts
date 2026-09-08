/**
 * 配置变更审批 API 模块（前端）
 * <p>封装配置/字典/变量变更审批流程相关接口。
 *
 * @path apps\system-web\src\api\config-approval.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { PageResponse } from './models';

import { requestClient } from './request';

import type {
  ConfigApprovalRecord,
  ConfigApprovalStatus,
  ConfigChangeRequestDTO,
  SubmitConfigChangeDTO,
} from './types/config-approval';

/** 审批列表查询参数（分页 + 审批状态筛选） */
export interface ConfigApprovalListQuery {
  /** 页码（1-based） */
  pageNum?: number;
  /** 每页条数 */
  pageSize?: number;
  /** 审批状态筛选 */
  status?: ConfigApprovalStatus;
  /** 资源类型筛选 */
  resourceType?: string;
}

/** 审批记录详情（含审计日志时间线） */
export interface ConfigApprovalDetail extends ConfigApprovalRecord {
  /** 审批流程审计日志时间线 */
  auditLogs: Array<{
    /** 节点序号 */
    seq: number;
    /** 节点名称（如「直接审批人」「部门负责人」） */
    nodeName: string;
    /** 操作人 */
    approverName: string;
    /** 操作（待审批/通过/拒绝/转交/撤回） */
    action: string;
    /** 操作时间 */
    actionTime: string;
    /** 备注 / 原因 */
    comment: string;
    /** 状态标签（pending / done / rejected / skipped） */
    status: string;
  }>;
}

// ---------------------------------------------------------------------------
// 列表接口
// ---------------------------------------------------------------------------

/**
 * 分页查询「待当前用户审批」的审批单。
 *
 * <p>GET /api/config/approval/pending
 *
 * @param query - 分页 + 状态筛选参数
 * @returns 分页审批记录
 */
export function listPendingApprovalApi(query: ConfigApprovalListQuery): Promise<PageResponse<ConfigApprovalRecord[]>> {
  return requestClient.get<PageResponse<ConfigApprovalRecord[]>>(
    '/api/config/approval/pending',
    { params: query },
  );
}

/**
 * 分页查询「当前用户已发起」的审批单。
 *
 * <p>GET /api/config/approval/submitted
 *
 * @param query - 分页 + 状态筛选参数
 * @returns 分页审批记录
 */
export function listSubmittedApprovalApi(query: ConfigApprovalListQuery): Promise<PageResponse<ConfigApprovalRecord[]>> {
  return requestClient.get<PageResponse<ConfigApprovalRecord[]>>(
    '/api/config/approval/submitted',
    { params: query },
  );
}

/**
 * 分页查询所有审批单（超管视角 / 审批中心）。
 *
 * <p>GET /api/config/approval/list
 *
 * @param query - 分页 + 状态筛选参数
 * @returns 分页审批记录
 */
export function listAllApprovalApi(query: ConfigApprovalListQuery): Promise<PageResponse<ConfigApprovalRecord[]>> {
  return requestClient.get<PageResponse<ConfigApprovalRecord[]>>(
    '/api/config/approval/list',
    { params: query },
  );
}

// ---------------------------------------------------------------------------
// 操作接口
// ---------------------------------------------------------------------------

/**
 * 通过审批单。
 *
 * <p>POST /api/config/approval/{id}/approve
 *
 * @param id - 审批单 ID
 * @param comment - 审批意见（可选）
 */
export function approveApprovalApi(id: string, comment?: string): Promise<boolean> {
  return requestClient.post<boolean>(`/api/config/approval/${id}/approve`, { comment });
}

/**
 * 拒绝审批单。
 *
 * <p>POST /api/config/approval/{id}/reject
 *
 * @param id - 审批单 ID
 * @param reason - 拒绝原因（必填）
 */
export function rejectApprovalApi(id: string, reason: string): Promise<boolean> {
  return requestClient.post<boolean>(`/api/config/approval/${id}/reject`, { reason });
}

/**
 * 撤消审批单。
 *
 * <p>仅审批单状态为「待审批」且当前用户为发起人时可撤回。
 * <p>POST /api/config/approval/{id}/withdraw
 *
 * @param id - 审批单 ID
 */
export function withdrawApprovalApi(id: string): Promise<boolean> {
  return requestClient.post<boolean>(`/api/config/approval/${id}/withdraw`);
}

/**
 * 获取审批单详情（含审计日志时间线）。
 *
 * <p>GET /api/config/approval/{id}
 *
 * @param id - 审批单 ID
 */
export function getApprovalDetailApi(id: string): Promise<ConfigApprovalDetail> {
  return requestClient.get<ConfigApprovalDetail>(`/api/config/approval/${id}`);
}

// ---------------------------------------------------------------------------
// 配置变更发起审批（配置管理页操作触发）
// ---------------------------------------------------------------------------

/**
 * 提交配置变更并发起审批流。
 *
 * <p>配置管理页面「保存」操作时，若配置启用审批开关，则调用此接口提交审批。
 * <p>POST /api/config/approval/submit
 *
 * @param data - 配置变更请求 DTO
 */
export function submitConfigChangeApi(data: SubmitConfigChangeDTO): Promise<{ approvalId: string }> {
  return requestClient.post<{ approvalId: string }>('/api/config/approval/submit', data);
}
