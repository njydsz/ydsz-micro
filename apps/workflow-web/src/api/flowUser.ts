/**
 * 流程用户搜索 API 封装。
 *
 * <p>基于后端 {@code UserinfoSearchController}，提供用户全文检索能力，
 * 用于转办/委派等场景下的目标用户选择。
 *
 * @path apps\workflow-web\src\api\flowUser.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { requestClient } from '#/api/request';

/**
 * 流程用户搜索结果项。
 *
 * <p>从 {@code SearchHit} 映射而来：id → userId, title → userName。
 */
export interface FlowUserSearchResult {
  /** 用户 ID */
  userId?: string;
  /** 用户姓名 */
  userName?: string;
}

/**
 * 用户搜索响应（前端视图）。
 */
export interface FlowUserSearchResponse {
  /** 搜索结果列表 */
  items?: FlowUserSearchResult[];
}

/**
 * 搜索用户。
 *
 * <p>调用 {@code GET /api/userinfo/search} 进行用户全文检索，
 * 返回结果由后端按权限过滤（非管理员仅可见本部门用户）。
 *
 * @param params 搜索参数（keyword 必填，page/pageSize 可选）
 * @return 搜索结果（items 为用户列表，userId/userName 用于选择器展示）
 */
export function searchUsers(params: {
  keyword: string;
  page?: number;
  pageSize?: number;
}): Promise<FlowUserSearchResponse> {
  return requestClient
    .get<{
      hits?: Array<{
        id?: string;
        title?: string;
      }>;
      total?: number;
      page?: number;
      pageSize?: number;
    }>('/api/userinfo/search', { params })
    .then((res) => {
      const hits = res.hits ?? [];
      return {
        items: hits.map((hit) => ({
          userId: hit.id ?? '',
          userName: hit.title ?? '',
        })),
      };
    });
}
