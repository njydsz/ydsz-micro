/**
 * 二次身份验证 API 模块（前端）
 * <p>封装二级认证相关接口，供响应拦截器与 useSecondaryAuth 调用。
 *
 * @path apps\system-web\src\api\secondary-auth.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { baseRequestClient } from './request';

/** 二次认证请求 DTO */
export interface SecondaryAuthDTO {
  /** 当前登录密码（明文，由后端 BCrypt 校验） */
  password: string;
  /** 认证场景（如 config-edit / dict-delete），用于后端审计 */
  scene?: string;
}

/** 二次认证响应 VO */
export interface SecondaryAuthVO {
  /** 二级认证通过令牌，后续请求头 X-Secondary-Auth 携带 */
  token: string;
  /** 有效期（毫秒） */
  expiresIn: number;
}

/**
 * 发起二次身份验证
 *
 * <p>POST /api/v1/auth/secondary-auth
 * 使用 baseRequestClient 避免进入业务拦截器链形成递归。
 *
 * @param data - 二次认证请求数据
 * @returns 认证令牌
 */
export async function secondaryAuthApi(
  data: SecondaryAuthDTO,
): Promise<SecondaryAuthVO> {
  // TODO: 对接真实 API —— 后端 SecondaryAuthController 实现后替换为 requestClient
  return baseRequestClient.post<SecondaryAuthVO>(
    '/api/v1/auth/secondary-auth',
    data,
  );
}
