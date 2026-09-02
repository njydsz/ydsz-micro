/**
 * workflow 命名类型别名导出
 *
 * <p>由 unified-contract.mjs 自动生成，请勿手动修改。
 * <p>提供 components.schemas 中定义的命名类型别名，消除 models.ts 手动类型定义。
 *
 * @auto-generated
 * @since 4.0.0
 */

import type { components } from './schema';

// 导出命名类型别名，便于业务代码直接使用
export type EmbeddedApprovalActionDTO = components['schemas']['EmbeddedApprovalActionDTO'];
export type FlowAssigneeDTO = components['schemas']['FlowAssigneeDTO'];
export type FlowAttachmentDTO = components['schemas']['FlowAttachmentDTO'];
export type FlowAutoTriggerCreateDTO = components['schemas']['FlowAutoTriggerCreateDTO'];
export type FlowCategoryDTO = components['schemas']['FlowCategoryDTO'];
export type FlowCcQuery = components['schemas']['FlowCcQuery'];
export type FlowCommentCreateDTO = components['schemas']['FlowCommentCreateDTO'];
export type FlowDelegateAuthPostDTO = components['schemas']['FlowDelegateAuthPostDTO'];
export type FlowDeployProcessDTO = components['schemas']['FlowDeployProcessDTO'];
export type FlowDesignerDataDTO = components['schemas']['FlowDesignerDataDTO'];
export type FlowInstanceVariablesDTO = components['schemas']['FlowInstanceVariablesDTO'];
export type FlowQuickCommentDTO = components['schemas']['FlowQuickCommentDTO'];
export type FlowSaveDraftDTO = components['schemas']['FlowSaveDraftDTO'];
export type FlowStartProcessDTO = components['schemas']['FlowStartProcessDTO'];
export type FlowSubmitDraftDTO = components['schemas']['FlowSubmitDraftDTO'];
export type FlowTaskOperateDTO = components['schemas']['FlowTaskOperateDTO'];
export type InstanceMigrationDTO = components['schemas']['InstanceMigrationDTO'];

// 常用响应类型别名
export type { PageResponse, YdszResponse } from '../models';
