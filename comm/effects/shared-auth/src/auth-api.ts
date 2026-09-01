/**
 * Auth API — 封装登录、登出、Token 刷新、权限码获取等后端认证接口
 *
 * 对齐后端 /api/v1/auth/*，提供类型安全的异步函数供子应用直接调用，
 * 消除各子应用重复实现的身份认证请求逻辑。
 *
 * @path comm\effects\shared-auth\src\auth-api.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type {
  AuthApiLoginParams,
  AuthApiLoginResult,
  AuthApiRefreshTokenResult,
} from './types';

import { baseRequestClient, requestClient } from './request-setup';

export { baseRequestClient, requestClient };

/**
 * 登录 — 调用后端账号密码登录接口
 *
 * @param data - 登录参数（用户名、密码、验证码等）
 * @returns 登录结果，含 accessToken、refreshToken 与用户信息
 */
export async function loginApi(data: AuthApiLoginParams) {
  return requestClient.post<AuthApiLoginResult>(
    '/api/v1/auth/login',
    data,
  );
}

/**
 * 刷新 accessToken — 使用 refreshToken 换取新的 accessToken
 *
 * @param refreshToken - 当前有效的 refreshToken
 * @returns 刷新结果，含新的 accessToken 与 refreshToken
 */
export async function refreshTokenApi(refreshToken: string) {
  return baseRequestClient.post<AuthApiRefreshTokenResult>(
    '/api/v1/auth/refresh',
    { refreshToken },
  );
}

/**
 * 退出登录 — 通知后端清除认证凭据
 *
 * @returns 登出响应
 */
export async function logoutApi() {
  return baseRequestClient.post('/api/v1/auth/logout', {});
}

/**
 * 获取用户权限码 — 返回当前用户持有的全部权限标识列表
 *
 * @returns 权限码字符串数组
 */
export async function getAccessCodesApi() {
  return requestClient.get<string[]>('/api/v1/auth/codes');
}
