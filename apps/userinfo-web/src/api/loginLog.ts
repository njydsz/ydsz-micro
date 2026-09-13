/**
 * 登录日志 API 封装
 *
 * <p>对应后端 {@code LoginLogController}，提供用户登录历史分页查询。
 *
 * @author ydsz-team
 * @since 26.09.13
 */
import { requestClient } from '#/api/request';
import type { LoginLogPageQuery, LoginLogVO } from './models';
import type { PageResponse } from './models';

/**
 * 分页查询登录日志。
 *
 * @param query 分页查询条件
 * @returns 登录日志分页列表
 */
export function pageLoginLog(query: LoginLogPageQuery): Promise<PageResponse<LoginLogVO[]>> {
  return requestClient.get<PageResponse<LoginLogVO[]>>('/api/userinfo/login-log/page', { params: query });
}
