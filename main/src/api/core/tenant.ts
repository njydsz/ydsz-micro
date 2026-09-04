/**
 * 租户 API —— 当前用户可访问租户查询（多租户切换器数据源）
 *
 * @path main\src\api\core\tenant.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { requestClient } from '#/api/request';

/** 租户简要信息（后端 TenantVO 子集，前端切换器仅需 id/code/name） */
export interface TenantSimpleVO {
  id: string;
  tenantCode: string;
  tenantName: string;
}

/**
 * 查询当前用户可访问的租户列表。
 *
 * <p>超级管理员返回全部已启用租户；普通租户管理员仅返回自身租户。
 *
 * @returns 可访问租户列表
 */
export async function getAccessibleTenantsApi(): Promise<TenantSimpleVO[]> {
  return requestClient.get<TenantSimpleVO[]>('/api/v1/tenant/accessible');
}
