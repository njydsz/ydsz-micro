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
  return requestClient.get<TenantSimpleVO[]>('/api/tenant/accessible');
}

/** 租户切换响应（对齐后端 TenantSwitchResponse 契约）。 */
export interface TenantSwitchResult {
  /** 新访问令牌（已包含目标租户声明） */
  accessToken: string;
  /** 新刷新令牌 */
  refreshToken: string;
  /** 令牌类型，固定为 Bearer */
  tokenType: string;
  /** 目标租户 ID */
  targetTenantId: string;
}

/**
 * 切换当前用户的活动租户上下文。
 *
 * <p>调用后端 {@code POST /api/auth/tenant/switch}（P1 多租户 JWT 切换）：
 * 校验目标租户在可访问列表后签发新 token 对，旧 token 立即吊销，实现免重新登录切换。
 * 成功后调用方需将新 token 写回 token store 并刷新页面加载新租户上下文。
 *
 * @param targetTenantId - 目标租户 ID（需在当前 token 的 accessible_tenants 内）
 * @returns 新 token 对
 */
export async function switchTenantApi(
  targetTenantId: string,
): Promise<TenantSwitchResult> {
  return requestClient.post<TenantSwitchResult>('/api/auth/tenant/switch', {
    targetTenantId,
  });
}
