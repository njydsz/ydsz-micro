/**
 * 用户检索 API 封装（跨服务复用 userinfo 搜索能力）
 *
 * <p>文件评论场景需要「按关键字搜索用户」以支撑 @提及选择器：提交时把选中用户 ID
 * 写入 addComment 请求体的 mentions（List&lt;String&gt;）。
 * 后端能力位于 userinfo 服务（GET /api/v1/userinfo/search），经统一网关调用；
 * 本文件为手写封装（非 bash/gen-contract.py 生成，勿覆盖）。
 *
 * @path apps/nextwiki-web/src/api/userSearch.ts
 * @author ydsz-team
 * @since 4.2.0
 */
import { requestClient } from '#/api/request';

/** 用户搜索命中项（透传 SearchHit 的核心字段） */
export interface UserSearchHit {
  /** 用户 ID（选中后作为 mentions 关联值） */
  id?: string;
  /** 显示名称 */
  title?: string;
  /** 登录名等辅助信息 */
  subtitle?: string;
}

/** 用户搜索结果 */
export interface UserSearchResult {
  hits?: UserSearchHit[];
  total?: number;
}

/**
 * 按关键字搜索用户
 *
 * @param params 检索参数
 * @param params.keyword 关键字（显示名/登录名等，空串时返回默认列表）
 * @param params.page 页码（从 1 开始）
 * @param params.pageSize 每页条数
 */
export function searchUsers(params: {
  keyword?: string;
  page?: number;
  pageSize?: number;
}): Promise<UserSearchResult> {
  return requestClient.get<UserSearchResult>(`/api/v1/userinfo/search`, { params });
}