/**
 * 认证模块类型定义（对齐后端 LoginVO 结构）
 *
 * 声明登录请求/响应、用户信息、刷新 token 等核心类型，
 * 供 shared-auth 包内 API 层与 Store 层共用，确保前后端契约一致。
 *
 * @path comm\effects\shared-auth\src\types.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** 登录接口参数 */
export interface AuthApiLoginParams {
  username?: string;
  password?: string;
  captcha?: string;
  captchaKey?: string;
}

/** 登录接口返回值（对齐后端 LoginVO） */
export interface AuthApiLoginResult {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  scope: string;
  userInfo: AuthApiUserInfoVO;
}

/** 用户信息（对齐后端 LoginVO.UserInfoVO） */
export interface AuthApiUserInfoVO {
  userId: string;
  username: string;
  realName: string;
  roleCode?: string;
  roleName?: string;
  tenantId?: string;
  avatar?: string;
  email?: string;
  phone?: string;
  deptId?: string;
  deptName?: string;
  roles?: string[];
  permissions?: string[];
}

/** 刷新 token 的返回值结构（对齐后端刷新接口） */
export interface AuthApiRefreshTokenResult {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}
