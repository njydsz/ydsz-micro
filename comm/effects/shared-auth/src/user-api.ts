/**
 * User API — 获取当前登录用户信息
 *
 * 封装后端 /api/v1/auth/userinfo 接口，供登录后拉取用户资料使用，
 * 消除各子应用重复实现的用户信息查询逻辑。
 *
 * @path comm\effects\shared-auth\src\user-api.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { UserInfo } from '@ydsz/types';

import { requestClient } from './request-setup';

/**
 * 获取当前登录用户信息
 *
 * @returns 用户基本信息（UserInfo）
 */
export async function getUserInfoApi() {
  return requestClient.get<UserInfo>('/api/v1/auth/userinfo');
}
