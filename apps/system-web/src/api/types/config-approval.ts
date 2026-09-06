/**
 * 配置变更审批 —— 类型定义
 *
 * @path apps\system-web\src\api\types\config-approval.ts
 * @author ydsz-team
 * @since 1.0.0
 */

// ---------------------------------------------------------------------------
// 枚举
// ---------------------------------------------------------------------------

/** 审批资源对应的上游实体类型 */
export type ConfigApprovalResourceType = 'CONFIG' | 'DICT' | 'VARIABLE';

/** 审批单中变更操作类型 */
export type ConfigApprovalChangeType = 'CREATE' | 'UPDATE' | 'DELETE';

/** 审批单状态 */
export type ConfigApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';

// ---------------------------------------------------------------------------
// 列表/详情
// ---------------------------------------------------------------------------

/**
 * 配置变更审批单（列表展示）
 */
export interface ConfigApprovalRecord {
  /** 审批单唯一 ID */
  id: string;
  /** 审批标题（如"配置变更申请：system.cache.ttl"） */
  title: string;
  /** 资源类型 */
  resourceType: ConfigApprovalResourceType;
  /** 资源唯一标识（如配置键、字典类型编码、变量键） */
  resourceKey: string;
  /** 资源分组（仅 CONFIG 类型有值） */
  resourceGroup?: string;
  /** 变更操作类型 */
  changeType: ConfigApprovalChangeType;
  /** 变更前的 JSON 值（CREATE 时为空） */
  beforeJson?: string;
  /** 变更后的 JSON 值（DELETE 时为空） */
  afterJson?: string;
  /** 审批状态 */
  status: ConfigApprovalStatus;
  /** 发起人 ID */
  submitterId: string;
  /** 发起人姓名 */
  submitterName: string;
  /** 发起时间（ISO8601） */
  submittedAt: string;
  /** 当前审批人姓名（PENDING 时有值） */
  currentApproverName?: string;
  /** 变更原因（发起人填写） */
  reason?: string;
  /** 拒绝原因（REJECTED 时有值） */
  rejectionReason?: string;
  /** 审批单关闭时间（APPROVED / REJECTED / WITHDRAWN 时有值） */
  closedAt?: string;
}

// ---------------------------------------------------------------------------
// 提交审批
// ---------------------------------------------------------------------------

/**
 * 配置变更提交审批 DTO（前端发起审批流时使用）
 */
export interface SubmitConfigChangeDTO {
  resourceType: ConfigApprovalResourceType;
  resourceKey: string;
  changeType: ConfigApprovalChangeType;
  beforeJson?: string;
  afterJson?: string;
  reason?: string;
}
