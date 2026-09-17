/**
 * DagWorkflowController API 封装（手动对齐 DagWorkflowController）。
 *
 * <p>对应后端 {@code DagWorkflowController}（/agent/dag-workflow）。
 */
import { requestClient } from '#/api/request';
import type { DagWorkflow } from '#/api/models';

/** 保存工作流请求 */
export interface SaveDagWorkflowRequest {
  workflowCode?: string;
  workflowName: string;
  description?: string;
  dslContent: string;
  layoutJson?: string;
  category?: string;
}

/** 保存工作流（新建/更新） */
export function saveDagWorkflow(data: SaveDagWorkflowRequest): Promise<string> {
  return requestClient.post<string>('/api/agent/dag-workflow/save', data);
}

/** 根据编码查询工作流 */
export function getDagWorkflow(code: string): Promise<DagWorkflow> {
  return requestClient.get<DagWorkflow>(`/api/agent/dag-workflow/${code}`);
}

/** 查询工作流列表 */
export function listDagWorkflows(category?: string): Promise<DagWorkflow[]> {
  return requestClient.get<DagWorkflow[]>('/api/agent/dag-workflow/list', { params: { category } });
}

/** 删除工作流 */
export function deleteDagWorkflow(code: string): Promise<boolean> {
  return requestClient.delete<boolean>(`/api/agent/dag-workflow/${code}`);
}
