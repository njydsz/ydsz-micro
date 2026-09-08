/**
 * 二次身份验证 API 模块（前端）
 * <p>封装二级认证相关接口，供响应拦截器与 useSecondaryAuth 调用。
 *
 * @path apps\system-web\src\api\secondary-auth.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { requestClient } from './request';

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
 * <p>POST /api/auth/secondary-auth
 *
 * @param data - 二次认证请求数据
 * @returns 认证令牌
 */
export async function secondaryAuthApi(
  data: SecondaryAuthDTO,
): Promise<SecondaryAuthVO> {
  return requestClient.post<SecondaryAuthVO>(
    '/api/auth/secondary-auth',
    data,
  );
}
