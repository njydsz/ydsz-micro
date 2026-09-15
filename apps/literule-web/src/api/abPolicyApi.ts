/**
 * AB 测试策略管理 API 封装
 *
 * <p>覆盖后端 {@code RuleABPolicyController}（路径 /ab-policy）的全量 CRUD 与高级端点。
 * <p>路径规范: /api/literule/**（kebab-case），成功码统一为 code === 'A00000'。
 *
 * @path apps\literule-web\src\api\abPolicyApi.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { requestClient } from '#/api/request';
import type { RuleABPolicyDTO, RuleABPolicyVO, RuleABRollbackVO } from './models';

/**
 * pageABPolicies: POST /api/literule/ab-policy/page
 */
export function pageABPolicies(params: {
    pageNum?: number;
    pageSize?: number;
    ruleCode?: string;
  }): Promise<{ items: RuleABPolicyVO[]; total: number }> {
  return requestClient.post<{ items: RuleABPolicyVO[]; total: number }>(`/api/literule/ab-policy/page`, params);
}

/**
 * createABPolicy: POST /api/literule/ab-policy
 */
export function createABPolicy(data: RuleABPolicyDTO): Promise<RuleABPolicyVO> {
  return requestClient.post<RuleABPolicyVO>(`/api/literule/ab-policy`, data);
}

/**
 * getABPolicyById: GET /api/literule/ab-policy/{id}
 */
export function getABPolicyById({ id }: {
    id: string;
  }): Promise<RuleABPolicyVO> {
  return requestClient.get<RuleABPolicyVO>(`/api/literule/ab-policy/${id}`);
}

/**
 * updateABPolicyById: PUT /api/literule/ab-policy/{id}
 */
export function updateABPolicyById({ id }: {
    id: string;
  }, data: RuleABPolicyDTO): Promise<void> {
  return requestClient.put<void>(`/api/literule/ab-policy/${id}`, data);
}

/**
 * deleteABPolicy: DELETE /api/literule/ab-policy/{id}
 */
export function deleteABPolicy({ id }: {
    id: string;
  }): Promise<void> {
  return requestClient.delete<void>(`/api/literule/ab-policy/${id}`);
}

/**
 * evaluateABPolicy: POST /api/literule/ab-policy/{id}/evaluate
 */
export function evaluateABPolicy({ id }: {
    id: string;
  }): Promise<Record<string, unknown>> {
  return requestClient.post<Record<string, unknown>>(`/api/literule/ab-policy/${id}/evaluate`);
}

/**
 * manualRollbackABPolicy: POST /api/literule/ab-policy/{id}/manual-rollback
 */
export function manualRollbackABPolicy({ id }: {
    id: string;
  }, params: {
    reason?: string;
  }): Promise<RuleABRollbackVO> {
  return requestClient.post<RuleABRollbackVO>(`/api/literule/ab-policy/${id}/manual-rollback`, { params });
}

/**
 * getABRollbackHistory: GET /api/literule/ab-policy/{id}/rollback-history
 */
export function getABRollbackHistory({ id }: {
    id: string;
  }): Promise<RuleABRollbackVO[]> {
  return requestClient.get<RuleABRollbackVO[]>(`/api/literule/ab-policy/${id}/rollback-history`);
}
