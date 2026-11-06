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
 * <p>POST /api/auth/2fa
 *
 * <p>路径说明：2026-11-06 前本端点为 `/auth/secondary-auth`，与 ydsz-userinfo 的同名端点
 * （场景化 Redis 标记契约）发生路径抢注，网关只能路由给一侧。经决策将本侧改名为 `/auth/2fa`
 * 以消除冲突（userinfo 侧保持 `/auth/secondary-auth` 不变，其实现含审计/限流/WebAuthn）。
 *
 * @param data - 二次认证请求数据
 * @returns 认证令牌
 */
export async function secondaryAuthApi(data: SecondaryAuthDTO): Promise<SecondaryAuthVO> {
  return requestClient.post<SecondaryAuthVO>('/auth/2fa', data);
}
